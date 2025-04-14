const { signup } = require("./signup");
const { accountVerification } = require("./accountVerification");
const { login } = require("./login");
const { verifyUser } = require("./verifyUser");
const { logout } = require("./logout");
const { forgetPassword } = require("./forgetPassword");
const { googleCallback } = require("./googleCallback");

const {
  forgetPasswordOtpVerification,
} = require("./forgetPasswordOtpVerification");

module.exports = {
  signup,
  accountVerification,
  login,
  verifyUser,
  logout,
  forgetPassword,
  forgetPasswordOtpVerification,
  googleCallback,
};
