const emailServiceQueue = require("@/redis/bullMQ/producer");

/**
 * Adds an email job to the email service queue with specified data
 * @param {string} name - The name of the job, typically used to identify the type of email to be sent
 * @param {Object} dataObj - The data object containing all necessary information for the email
 * @return {Promise<Object>} A promise that resolves to the response from the queue system, indicating the job's enqueue status
 */
const addEmailInQueue = async (name, dataObj) => {
  const response = await emailServiceQueue.add(name, dataObj, {
    removeOnComplete: true,
    removeOnFail: true,
  });
  return response;
};

module.exports = { addEmailInQueue };
