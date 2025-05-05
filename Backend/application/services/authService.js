const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const CustomError = require('../../utils/cerror');
const { client } = require('../../infrastructure/external/redisClient');
const mailService = require('../../infrastructure/messaging/mailService');
const userModel = require('../../infrastructure/database/models/user.m');
const ROLES = require('../enums/roles');
const { v4: uuidv4 } = require('uuid');

class AuthService {
    static generateTokens(sessionId, userId) {
        const jti = uuidv4(sessionId);
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
        const code = crypto.randomInt(100000, 999999).toString();
    
        user.role = ROLES.USER;
        await client.set(code, JSON.stringify(user), 'EX', 1200);
    
        await mailService.sendConfirmationEmail(user.email, user.username, code);
    
        return { username: user.username };
    }

    static async verifyAccount(code) {
        if (!code) {
            throw new CustomError(400, 'Verification code is required');
        }
    
        const sessionData = await client.get(code);
        if (!sessionData) {
            throw new CustomError(401, 'Invalid or expired verification code');
        }
    
        const user = JSON.parse(sessionData);
        if (!user) {
            throw new CustomError(404, 'Invalid verification code');
        }

        await client.del(code); // Clean up after use
        try {
            const addedUser = await userModel.add(user);
            await mailService.sendThankYouEmail(user.email, user.username);

            return addedUser;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new CustomError(409, 'User already exists');
            } else {
                throw new CustomError(500, 'Failed to add user to the database');
            }
        }
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