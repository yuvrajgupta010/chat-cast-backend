const express = require("express");
const passport = require("passport");
const { body, query } = require("express-validator");

const User = require("@/models/user");
const authController = require("@/controllers/auth");
const { ACCOUNT_CREATED_BY_EMAIL } = require("@/helpers/constant");
const { forgetTokenVerification } = require("@/middlewares/jwt");

const router = express.Router();

// sign up with email and password
router.post(
  "/signup",
  [
    body("fullName")
      .isString()
      .withMessage("Full name have to be string")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Please enter your full name"),
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user) {
          return Promise.reject("Account already exists with this email!");
        }
      }),
    body("password")
      .isString()
      .withMessage("Password must be a string")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  authController.signup
);

// account verification
router.post(
  "/account-verification",
  [
    query("type", "Please provide 'type' query parameter")
      .trim()
      .notEmpty()
      .toLowerCase()
      .isIn(["verify", "resend"])
      .withMessage('Type must be either "verify" or "resend" in query param'),
    body("otp")
      .if((value, { req }) => req.query.type === "verify")
      .notEmpty()
      .isNumeric()
      .withMessage("otp must be a number")
      .isLength({ min: 6, max: 6 })
      .withMessage("Please provide valid OTP"),
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email")
      .custom(async (value, { req }) => {
        const user = await User.findOne({
          email: value,
          // isAccountVerified: true,
          accountAuthType: ACCOUNT_CREATED_BY_EMAIL,
        });
        if (!user) {
          return Promise.reject("Account not found!");
        } else if (user.isAccountVerified === true) {
          return Promise.reject("Account already verified!");
        }
      }),
  ],
  authController.accountVerification
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (!user) {
          return Promise.reject("Account not exist!");
        }
        if (user.accountAuthType !== ACCOUNT_CREATED_BY_EMAIL) {
          return Promise.reject(
            `Your account created using ${user.authenticator.authenticatorName}, please use social login!`
          );
        }

        // attach user document to request so we do need to query it again
        req.user = user;
      }),
    body("password")
      .isString()
      .withMessage("Password must be a string")
      .trim()
      .notEmpty()
      .isLength({ min: 8 })
      .withMessage("Invaild password!"),
  ],
  authController.login
);

router.post(
  "/forget-password",
  [
    body("email")
      .trim()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (!user) {
          return Promise.reject("Account not exist!");
        } else if (user.isAccountVerified === false) {
          return Promise.reject(
            "Account not verified, please verify your email first!"
          );
        }
        if (user.accountAuthType !== ACCOUNT_CREATED_BY_EMAIL) {
          return Promise.reject(
            `Your account created using ${user.authenticator.authenticatorName}, please use social login!`
          );
        }
        // attach user document to request so we do need to query it again
        req.user = user;
      }),
  ],
  authController.forgetPassword
);

router.put(
  "/forget-password",
  forgetTokenVerification,
  [
    query("type", "Please provide 'type' query parameter")
      .trim()
      .notEmpty()
      .toLowerCase()
      .isIn(["verify", "resend"])
      .withMessage('Type must be either "verify" or "resend" in query param'),
    body("email") // this email in body come from above forgetTokenVerification middleware
      .trim()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email."),
    body("otp")
      .if((value, { req }) => req.query.type === "verify")
      .notEmpty()
      .isNumeric()
      .withMessage("otp must be a number")
      .isLength({ min: 6, max: 6 })
      .withMessage("Please provide valid OTP"),
    body("newPassword")
      .if((value, { req }) => req.query.type === "verify")
      .isString()
      .withMessage("Password must be string")
      .trim()
      .notEmpty()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("confirmPassword")
      .if((value, { req }) => req.query.type === "verify")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Confirm Password does not match new password");
        }
        return true;
      }),
  ],
  authController.forgetPasswordOtpVerification
);

// sign up with google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// sign up with google account callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FAILURE_REDIRECT_URL_PATH,
  }),
  authController.googleCallback
);

module.exports = router;
