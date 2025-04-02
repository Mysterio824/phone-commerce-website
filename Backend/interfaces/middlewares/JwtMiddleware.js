const jwt = require('jsonwebtoken');
const CustomError = require('../../utils/cerror');
const { client } = require('../../infrastructure/external/redisClient');
const ROLES = require('../../application/enums/roles');
require('dotenv').config();

const checkUser = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        
        if (!accessToken) {            
            req.user = { role: ROLES.NON_USER };
            return next();
        }

        const isBlacklisted = await client.get(`blacklist:${accessToken}`);
        if (isBlacklisted) {
            res.clearCookie('accessToken'); 
            req.user = { role: ROLES.NON_USER };
            return next();
        }

        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const { sessionId, userId } = decoded;

        if (!sessionId || !userId) {
            res.clearCookie('accessToken');
            throw new CustomError(401, 'Invalid token payload.');
        }

        const sessionData = await client.get(sessionId);
        if (!sessionData) {
            res.clearCookie('accessToken');
            throw new CustomError(401, 'Session expired or invalid. Please log in again.');
        }

        const user = JSON.parse(sessionData);
        if (user.uid !== userId) {
            res.clearCookie('accessToken');
            throw new CustomError(401, 'Invalid user session.');
        }

        if (!user.role) {
            user.role = ROLES.USER;
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            res.clearCookie('accessToken');
            return res.status(401).json({ message: 'Invalid or expired token. Please refresh your token or log in again.' });
        }

        const statusCode = error.statusCode || 500;
        const message = error.message || 'An error occurred while authenticating the user.';
        res.status(statusCode).json({ message });
    }
};

module.exports = checkUser;