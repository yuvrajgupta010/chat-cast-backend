const bcrypt = require("bcrypt");
const saltRounds = 10;

/**
 * Hashes a password using bcrypt
 * @param {string} password - The password to hash
 * @return {Promise<string>} The hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw error;
  }
};

/**
 * Compares a plain text password with a hashed password to check if they match
 * @param {string} password - The plain text password
 * @param {string} hash - The hashed password
 * @return {Promise<boolean>} True if the passwords match, otherwise false
 */
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
