const { createClient } = require("redis");
const config = require("../../config");

const client = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
});

// Flag to track initial connection attempt
let isConnecting = false;
let connectionEstablished = false;

// Handle connection events
client.on("connect", () => {
  console.log(
    `Connecting to Redis at ${config.redis.host}:${config.redis.port}...`
  );
});

client.on("ready", () => {
  connectionEstablished = true;
  console.log(
    `Redis client ready (connected to ${config.redis.host}:${config.redis.port}).`
  );
});

client.on("error", (err) => {
  console.error("Redis Client Error:", err.message || err);
  if (!connectionEstablished && isConnecting) {
    console.error(
      "FATAL ERROR: Could not establish initial connection to Redis."
    );
    process.exit(1);
  }
  connectionEstablished = false;
});

client.on("end", () => {
  connectionEstablished = false;
  console.log("Redis client connection closed.");
});

// Connect to Redis asynchronously
const connectRedis = async () => {
  if (!client.isOpen && !isConnecting) {
    isConnecting = true;
    try {
      console.log(`Attempting connection to Redis...`);
      await client.connect();
    } catch (err) {
      console.error(
        "Failed to connect to Redis on startup:",
        err.message || err
      );
      process.exit(1);
    } finally {
      isConnecting = false;
    }
  }
};

// Initiate connection
connectRedis();

const shutdown = async () => {
  if (client && client.isOpen) {
    try {
      await client.quit();
      console.log("Disconnected from Redis.");
    } catch (err) {
      console.error("Error disconnecting from Redis:", err.message);
    }
  } else {
    console.log("Redis client already disconnected or not initialized.");
  }
};

module.exports = {
  client,
  shutdown,
};
