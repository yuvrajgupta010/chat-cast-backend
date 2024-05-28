const { createClient } = require("redis");

// Create a Redis client
const redisClient = createClient();

// Error handling
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Connection handling
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

// Ready event handling (client is ready to use)
redisClient.on("ready", () => {
  console.log("Redis client is ready to use");
});

// Connect to the Redis server
redisClient.connect().catch(console.error);

module.exports = redisClient;
