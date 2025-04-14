const redisClient = require("@/configs/redis.js");

const checkIsUserOnline = async (userId) => {
  const user = await redisClient.get(`chat-cast:userId:${userId}`);
  if (user) {
    return true;
  } else {
    return false;
  }
};

module.exports = { checkIsUserOnline };
