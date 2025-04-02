const { createClient } = require('redis');
require('dotenv').config();

// Create a Redis client
const client = createClient({
    socket: {
        host: 'localhost',
        port: process.env.REDIS_PORT || 6379,
    },
});

// Handle connection errors
client.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
});

// Connect to Redis
(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis on port', process.env.REDIS_PORT || 6379);
    } catch (err) {
        console.error('Failed to connect to Redis:', err.message);
    }
})();

// Gracefully disconnect Redis client on server shutdown
const shutdown = async () => {
    try {
        await client.quit();
        console.log('Disconnected from Redis');
    } catch (err) {
        console.error('Error disconnecting from Redis:', err.message);
    }
};

module.exports = { client, shutdown };