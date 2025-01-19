const { Queue } = require("bullmq");
const { EMAIL_SERVICE_QUEUE } = require("../../helpers/constant");

const REDIS_HOST_ADDRESS = process.env.REDIS_HOST_ADDRESS;
const REDIS_HOST_PORT = process.env.REDIS_HOST_PORT;

const emailServiceQueue = new Queue(EMAIL_SERVICE_QUEUE, {
  connection: {
    host: REDIS_HOST_ADDRESS,
    port: REDIS_HOST_PORT,
  },
});

module.exports = emailServiceQueue;
