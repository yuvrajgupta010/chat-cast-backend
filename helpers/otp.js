const crypto = require("crypto");

exports.generateSecureOTP = () => {
  const otp = crypto.randomInt(100000, 1000000); // Note the max is exclusive, hence 1000000
  return otp.toString();
};
