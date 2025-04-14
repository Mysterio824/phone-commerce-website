const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const CustomError = require('../../utils/cerror');
const { client } = require('../../infrastructure/external/redisClient');
const mailService = require('../../infrastructure/messaging/mailService');
const userModel = require('../../infrastructure/database/models/user.m');
const ROLES = require('../enums/roles');

class AuthService {
    static generateTokens(sessionId, userId) {
        const jti = uuidv4();
        const accessToken = jwt.sign(
            { sessionId, userId, jti },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );
        const refreshToken = jwt.sign(
            { sessionId, userId, jti },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        return { accessToken, refreshToken };
    }

    static setTokensInCookies(res, accessToken, refreshToken) {
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            expires: new Date(Date.now() + 3600 * 1000),
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            expires: new Date(Date.now() + 3600 * 8 * 1000),
        });
    }

    static async storeSession(sessionId, user) {
        if (!user.role) {
            user.role = ROLES.USER;
        }
        await client.set(sessionId, JSON.stringify(user), 'EX', 3600 * 8);
    }

    static async handleGoogleAuth(user) {
        const sessionId = crypto.randomBytes(10).toString('hex');
        const { accessToken, refreshToken } = this.generateTokens(sessionId, user.uid);
        await this.storeSession(sessionId, user);
        return { accessToken, refreshToken };
    }

    static async handleLogin(user) {
        const sessionId = crypto.randomBytes(10).toString('hex');
        const { accessToken, refreshToken } = this.generateTokens(sessionId, user.uid);
        await this.storeSession(sessionId, user);
        return { accessToken, refreshToken };
    }

    static async handleSignup(user) {
        const sessionId = crypto.randomBytes(10).toString('hex');
        const confirmToken = jwt.sign(
            { sessionId },
            process.env.EMAIL_CONFIRMATION_SECRET
        );

        user.role = ROLES.USER;
        await client.set(sessionId, JSON.stringify(user), 'EX', 3600);

        const confirmationUrl = `https://localhost:${process.env.PORT}/auth/confirm/${confirmToken}`;
        await mailService.sendConfirmationEmail(user.email, user.username, confirmationUrl);

        return { username: user.username, confirmToken };
    }

    static async verifyAccount(token) {
        if (!token) {
            throw new CustomError(404, 'Invalid token');
        }

        const decoded = jwt.verify(token, process.env.EMAIL_CONFIRMATION_SECRET);
        const sessionData = await client.get(decoded.sessionId);
        if (!sessionData) {
            throw new CustomError(401, 'Session expired or invalid');
        }

        const user = JSON.parse(sessionData);
        if (!user) {
            throw new CustomError(404, 'Invalid token');
        }

        await client.del(decoded.sessionId);
        await userModel.add(user);

        return user;
    }

    static async refresh(refreshToken) {
        if (!refreshToken) {
            throw new CustomError(401, 'No refresh token provided.');
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new CustomError(401, 'Refresh token expired. Please log in again.');
            }
            throw new CustomError(401, 'Invalid refresh token.');
        }

        const { sessionId, userId } = decoded;

        if (!sessionId || !userId) {
            throw new CustomError(401, 'Invalid refresh token payload.');
        }

        const sessionData = await client.get(sessionId);
        if (!sessionData) {
            throw new CustomError(401, 'Session expired or invalid. Please log in again.');
        }

        const user = JSON.parse(sessionData);
        if (user.uid !== userId) {
            throw new CustomError(401, 'Invalid user session.');
        }

        const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(sessionId, userId);

        await this.storeSession(sessionId, user);

        return { accessToken, newRefreshToken };
    }

    static async logout(accessToken) {
        if (!accessToken) {
            throw new CustomError(400, 'Access token is required for logout.');
        }
        const decodedToken = jwt.decode(accessToken);
        if (!decodedToken || !decodedToken.sessionId) {
            throw new CustomError(400, 'Invalid access token.');
        }

        const { sessionId } = decodedToken;

        await client.del(sessionId);
        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.JWT_SECRET, {
                ignoreExpiration: true,
            });
        } catch (error) {
            throw new CustomError(401, 'Invalid access token.');
        }
        if (!decoded || !decoded.jti || !decoded.exp) {
            return { message: 'Logout successful (session deleted, token missing claims for blacklist).' };
        }
        const { jti, exp } = decoded;
        const blacklistKey = `blacklist:jti:${jti}`;
        const currentTime = Math.floor(Date.now() / 1000);

        const ttl = exp - currentTime;
        if (ttl > 0) {
             await client.set(blacklistKey, '1', 'EX', ttl); 
        }

        return { message: 'Logout successful.' };
    }
}

module.exports = AuthService;