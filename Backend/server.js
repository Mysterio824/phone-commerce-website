const express = require('express');
const session = require('express-session');
const passport = require('./interfaces/passport/passport');
const { shutdown: redisShutdown, client: redisClient } = require('./infrastructure/external/redisClient');
const { exec } = require('child_process');
const util = require('util');
const cookieParser = require('cookie-parser');
const checkUser = require('./interfaces/middlewares/JwtMiddleware');
const restrictTo = require('./interfaces/middlewares/restrictTo');
const ROLES = require('./application/enums/roles');
const config = require('./config');
const cors = require('cors');

const app = express();

app.use(cors(config.app.cors));

app.use('/static', express.static('public'));

app.use(express.json({ limit: config.app.bodyParserLimit || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: config.app.bodyParserLimit || '10mb' }));
app.use(cookieParser());

app.use(session({
    secret: config.auth.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.app.environment === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(checkUser);

const authRoutes = require('./interfaces/routes/authRoute');
const userRoutes = require('./interfaces/routes/userRoute');
const productRoutes = require('./interfaces/routes/productRoute');
const cartRoutes = require('./interfaces/routes/cartRoute');
const categoryRoutes = require('./interfaces/routes/categoryRoute');
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/product', productRoutes);
app.use('/cart', cartRoutes);
app.use('/category', categoryRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Phone Commerce Website!', userRole: req.user?.role || ROLES.NON_USER });
});

app.get('/user', restrictTo(ROLES.USER, ROLES.ADMIN), (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}!`, user: req.user });
});

app.get('/admin', restrictTo(ROLES.ADMIN), (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard!', admin: req.user });
});

const PORT = config.app.port;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${config.app.environment} mode`);
});

const execPromise = util.promisify(exec);

const shutdown = async () => {
    console.log('Shutting down server...');
    try {
        await redisShutdown();
        const redisCliPath = process.env.REDIS_CLI_PATH;
        if (redisCliPath) {
            try {
                await execPromise(`"${redisCliPath}" -h ${config.redis.host} -p ${config.redis.port} SHUTDOWN`);
                console.log('Attempted to stop Redis server');
            } catch (err) {
                console.warn('Could not stop external Redis server (this might be expected):', err.message);
            }
        } else {
            console.warn("REDIS_CLI_PATH not set in .env, skipping external Redis shutdown command.");
        }
        server.close((err) => {
            if (err) {
                console.error('Error closing server:', err);
                process.exit(1);
            }
            console.log('Server shut down successfully');
            process.exit(0);
        });
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    } catch (err) {
        console.error('Error during shutdown:', err.message);
        process.exit(1);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown();
});

module.exports = app;