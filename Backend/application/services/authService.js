const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const CustomError = require('../../utils/cerror');
const { client } = require('../../infrastructure/external/redisClient');
const mailService = require('../../infrastructure/messaging/mailService');
const userModel = require('../../infrastructure/database/models/user.m');
const ROLES = require('../enums/roles');

class AuthService {
    static generateTokens(sessionId, userId) {
        const accessToken = jwt.sign(
            { sessionId, userId },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );
        const refreshToken = jwt.sign(
            { sessionId, userId },
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

    static async logout(accessToken, sessionId) {
        if (!accessToken || !sessionId) {
            throw new CustomError(400, 'Access token and session ID are required for logout.');
        }

        await client.del(sessionId);

        const decoded = jwt.decode(accessToken);
        const currentTime = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - currentTime > 0 ? decoded.exp - currentTime : 3600;
        await client.set(`blacklist:${accessToken}`, '1', 'EX', ttl);

        return { message: 'Logout successful.' };
    }
}

module.exports = AuthService;