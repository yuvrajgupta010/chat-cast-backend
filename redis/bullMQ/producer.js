const { Queue } = require("bullmq");
const {
  EMAIL_SERVICE_QUEUE,
  REDIS_HOST_ADDRESS,
  REDIS_HOST_PORT,
} = require("../../helpers/constant");

const emailServiceQueue = new Queue(EMAIL_SERVICE_QUEUE, {
  connection: {
    host: REDIS_HOST_ADDRESS,
    port: REDIS_HOST_PORT,
  },
});

module.exports = emailServiceQueue;
