const jwt = require('jsonwebtoken');
const { client } = require('../../infrastructure/external/redisClient');
const ROLES = require('../../application/enums/roles');
const config = require('../../config');

const checkUser = async (req, res, next) => {
    const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];

    if (!accessToken) {
        req.user = { role: ROLES.NON_USER };
        return next();
    }

    try {
        const decoded = jwt.verify(accessToken, config.auth.jwt.secret);
        const { jti, sessionId, userId } = decoded;

        if (!jti || !sessionId || !userId) {
            res.clearCookie('accessToken');
            return res.status(401).json({ message: 'Invalid token payload.' });
        }

        const blacklistedJtiKey = `blacklist:jti:${jti}`;
        const isBlacklisted = await client.get(blacklistedJtiKey);

        if (isBlacklisted) {
            res.clearCookie('accessToken');
            return res.status(401).json({ message: 'Token revoked. Please log in again.' });
        }

        const sessionData = await client.get(sessionId);
        if (!sessionData) {
            res.clearCookie('accessToken');
            return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
        }

        const user = JSON.parse(sessionData);
        if (user.uid !== userId) {
            res.clearCookie('accessToken');
            return res.status(401).json({ message: 'Invalid user session.' });
        }

        if (!user.role) {
            user.role = ROLES.USER;
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            res.clearCookie('accessToken');
            console.warn(`JWT Error: ${error.name} - ${error.message}`);
            return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
        }

        if (error.message.includes('Redis') || error.code === 'ECONNREFUSED') {
            console.error("Redis error during authentication:", error);
            return res.status(503).json({ message: 'Authentication service unavailable. Please try again later.' });
        }

        if (error instanceof SyntaxError) {
            console.error("Error parsing session data from Redis:", error);
            res.clearCookie('accessToken');
            return res.status(500).json({ message: 'Internal server error processing session.' });
        }

        console.error("Authentication error in middleware:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ message: error.statusCode ? error.message : 'An error occurred during authentication.' });
    }
};

module.exports = checkUser;