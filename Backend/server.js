const express = require('express');
const session = require('express-session');
const passport = require('./interfaces/passport/passport');
const authRoutes = require('./interfaces/routes/auth');
const { client: redisClient, shutdown: redisShutdown } = require('./infrastructure/external/redisClient');
const { exec } = require('child_process');
const util = require('util');
const cookieParser = require('cookie-parser');
const checkUser = require('./interfaces/middlewares/JwtMiddleware');
const restrictTo = require('./interfaces/middlewares/restrictTo');
const ROLES = require('./application/enums/roles');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(checkUser);

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Phone Commerce Website!', userRole: req.user.role });
});

app.get('/user', restrictTo(ROLES.USER, ROLES.ADMIN), (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}!`, user: req.user });
});

app.get('/admin', restrictTo(ROLES.ADMIN), (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard!', admin: req.user });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const execPromise = util.promisify(exec);

const shutdown = async () => {
    console.log('Shutting down server...');
    try {
        await redisShutdown();
        try {
            await execPromise(`"C:\\Program Files\\Redis\\redis-cli.exe" -h localhost -p ${process.env.REDIS_PORT || 6379} SHUTDOWN`);
            console.log('Redis server stopped successfully');
        } catch (err) {
            console.error('Error stopping Redis server:', err.message);
        }
        server.close(() => {
            console.log('Server shut down successfully');
            process.exit(0);
        });
    } catch (err) {
        console.error('Error during shutdown:', err.message);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;