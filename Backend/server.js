const express = require('express');
const session = require('express-session');
const passport = require('./interfaces/passport/passport');
const { shutdown: redisShutdown, client: redisClient } = require('./infrastructure/external/redisClient');
const { exec } = require('child_process');
const util = require('util');
const cookieParser = require('cookie-parser');
const checkUser = require('./interfaces/middlewares/JwtMiddleware');
const config = require('./config');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');
const initializeDatabase = require('./infrastructure/database/initializeDatabase');

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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);

const execPromise = util.promisify(exec);

const startServer = async () => {
    try {
        console.log('Initializing database...');
        const dbInitialized = await initializeDatabase();
            
        if (!dbInitialized) {
            console.error('Failed to initialize database. Exiting...');
            process.exit(1);
        }
            
            // Start the server
            const PORT = config.app.port;

            const server = https.createServer({ 
                key: fs.readFileSync(path.join(__dirname, '/certs/ca.key')), 
                cert: fs.readFileSync(path.join(__dirname, '/certs/ca.crt')),
              }, app);
            
            server.listen(PORT, () => {
                console.log(`Server running on port ${PORT} in ${config.app.environment} mode`);
            }); 

            // Graceful Shutdown Logic
        const shutdown = async () => {
            console.log('Shutting down server...');
            try {
            await redisShutdown();
            try {
                const redisCliPath = process.env.REDIS_CLI_PATH;
                if (redisCliPath) {
                await execPromise(`"${redisCliPath}" -h ${config.redis.host} -p ${config.redis.port} SHUTDOWN`);
                console.log('Redis server stopped successfully');
                }
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
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            shutdown();
        });
    } catch (error) {
      console.error('Error starting server:', error);
      process.exit(1);
    }
};
  
  // Start the server
startServer();

module.exports = app;