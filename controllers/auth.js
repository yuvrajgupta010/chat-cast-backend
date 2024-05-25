const mongoose = require("mongoose");
const ejs = require("ejs");
const path = require("path");

const User = require("../models/user");
const Otp = require("../models/otp");
const { jwtSignToken, jwtForgetToken } = require("../helpers/jwt");
const {
  ACCOUNT_CREATED_BY_EMAIL,
  VIEW_FOLDER_PATH,
  VERIFICATION_OTP,
  SIGN_UP_TEMPLATE,
  WELCOME_TEMPLATE,
  RESEND_OTP_TEMPLATE,
  RESET_PASSWORD_OTP,
  FORGET_PASSWORD_TEMPLATE,
  RESEND_FORGET_PASSWORD_TEMPLATE,
} = require("../helpers/constant");
const { hashPassword, comparePassword } = require("../helpers/bcrypt");
const { generateSecureOTP } = require("../helpers/otp");
const { sendEmail } = require("../helpers/sendgrid");
const { addEmailInQueue } = require("../helpers/bullMQ");
const { date5MinutesAgoFn } = require("../helpers/date");
const { expressValidation } = require("../helpers/validation");

const STATIC_FILE_S3_ADDRESS = process.env.STATIC_FILE_S3_ADDRESS;
const MAIN_APP_DOMAIN = process.env.MAIN_APP_DOMAIN;
const SERVER_ENV = process.env.SERVER_ENV;

exports.signup = async (req, res, next) => {
  const session = await mongoose.startSession(); // Start a new session for transactions
  session.startTransaction();

  try {
    expressValidation(req);

    const { fullName, email, password } = req.body;

    const encryptedPassword = await hashPassword(password);
    // OTP generate and send email
    const generatedOTP = generateSecureOTP();
    const year = new Date().getFullYear().toString();

    const user = new User({
      email,
      password: encryptedPassword,
      accountAuthType: ACCOUNT_CREATED_BY_EMAIL,
      profile: {
        fullName,
      },
    });

    const otpData = new Otp({
      otp: generatedOTP,
      userEmail: email,
      useFor: VERIFICATION_OTP,
    });

    await user.save({ session });
    await otpData.save({ session });

    // // Demostration for email without redis
    // const welcomeTemplatePath = path.join(VIEW_FOLDER_PATH, "signup.ejs");
    // const generatedHTML = await ejs.renderFile(welcomeTemplatePath, {
    //   staticFileDomain: STATIC_FILE_S3_ADDRESS,
    //   mainAppDomain: MAIN_APP_DOMAIN,
    //   user: {
    //     fullName,
    //     otp: generatedOTP,
    //   },
    //   year,
    // });
    // await sendEmail(
    //   email,
    //   "Sign up - Account Verification",
    //   "a",
    //   generatedHTML
    // );

    if (SERVER_ENV !== "DEV") {
      await addEmailInQueue(email, {
        templateType: SIGN_UP_TEMPLATE,
        emailInfo: {
          email,
          fullName,
          otp: generatedOTP,
          year,
        },
      });
    } else {
      console.log(generatedOTP, "OTP generated on signup");
    }

    await session.commitTransaction();

    return res.status(201).json({
      data: { user: user.toClient() },
      message:
        "Account created successfully and ready for verification. Please check your email for OTP",
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// email verification and resend OTP
exports.accountVerification = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    expressValidation(req);

    const { type: requestTypeQuery } = req.query;

    if (requestTypeQuery === "verify") {
      const { email, otp } = req.body;

      const date5MinutesAgo = date5MinutesAgoFn();
      const otpData = await Otp.findOne({
        // otp,
        userEmail: email,
        useFor: VERIFICATION_OTP,
        isVerified: false,
        createdAt: { $gte: date5MinutesAgo },
      })
        .sort({ createdAt: -1 })
        .session(session);

      if (!otpData) {
        const error = new Error("OTP is invalid or expired");
        error.status = 422;
        throw error;
      }

      // only validate last otp
      if (otpData.otp != otp) {
        const error = new Error("OTP is invalid or expired");
        error.status = 422;
        throw error;
      }

      const user = await User.findOneAndUpdate(
        { email },
        { isAccountVerified: true },
        { new: true, session }
      );

      if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
      }

      otpData.isVerified = true;
      await otpData.save({ session });

      const year = new Date().getFullYear().toString();

      if (SERVER_ENV !== "DEV") {
        await addEmailInQueue(email, {
          templateType: WELCOME_TEMPLATE,
          emailInfo: {
            email,
            fullName: user.profile.fullName,
            year,
          },
        });
      } else {
        console.log(`${email} account verified`);
      }

      await session.commitTransaction();

      return res.status(200).json({
        data: {
          user: user.toClient(),
          jwtToken: jwtSignToken({ email, userId: user.id }),
        },
        message: "Account verification done successfully",
      });
    } else if (requestTypeQuery === "resend") {
      const { email } = req.body;

      const date5MinutesAgo = date5MinutesAgoFn();

      const otpsData = await Otp.find({
        userEmail: email,
        useFor: VERIFICATION_OTP,
        isVerified: false,
        createdAt: { $gte: date5MinutesAgo },
      }).session(session);

      if (otpsData.length >= 3) {
        const error = new Error(
          "We have already sent 3 OTPs in last 5 minutes to your email, please check your email and try again"
        );
        error.status = 429;
        throw error;
      }

      const generatedOTP = generateSecureOTP();
      const year = new Date().getFullYear().toString();

      const otpData = new Otp({
        otp: generatedOTP,
        userEmail: email,
        useFor: VERIFICATION_OTP,
      });
      await otpData.save({ session });

      if (SERVER_ENV !== "DEV") {
        await addEmailInQueue(email, {
          templateType: RESEND_OTP_TEMPLATE,
          emailInfo: {
            email,
            otp: generatedOTP,
            year,
          },
        });
      } else {
        console.log(generatedOTP, "is new OTP");
      }

      // console.log(generatedOTP, "Resend email otp");
      await session.commitTransaction();

      return res.status(201).json({
        message: "OTP resended successfully",
      });
    }
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// login
exports.login = async (req, res, next) => {
  try {
    expressValidation(req);

    const { email, password } = req.body;

    const passwordResult = await comparePassword(password, req.user.password);

    if (!passwordResult) {
      const error = new Error("Invalid email or password");
      error.status = 400;
      throw error;
    }

    return res.status(200).json({
      data: {
        user: req.user.toClient(),
        jwtToken: jwtSignToken({ email, userId: req.user.id }),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.googleCallback = (req, res, next) => {
  const jwtToken = jwtSignToken({ email: req.user.email });
  return res.json({ userData: req.user.toClient(), jwtToken });
};

exports.forgetPassword = async (req, res, next) => {
  try {
    expressValidation(req);

    const { email } = req.body;
    // const {
    //   profile: { fullName },
    // } = req.user;

    const date5MinutesAgo = date5MinutesAgoFn();

    const otpsData = await Otp.find({
      userEmail: email,
      useFor: RESET_PASSWORD_OTP,
      isVerified: false,
      createdAt: { $gte: date5MinutesAgo },
    });

    if (otpsData.length >= 3) {
      const error = new Error(
        "We have already sent 3 OTPs in last 5 minutes to your email, please check your email and try again"
      );
      error.status = 429;
      throw error;
    }

    const year = new Date().getFullYear().toString();
    const generatedOTP = generateSecureOTP();

    const otpData = new Otp({
      otp: generatedOTP,
      userEmail: email,
      useFor: RESET_PASSWORD_OTP,
    });

    await otpData.save();

    if (SERVER_ENV !== "DEV") {
      await addEmailInQueue(email, {
        templateType: FORGET_PASSWORD_TEMPLATE,
        emailInfo: {
          email,
          otp: generatedOTP,
          year,
        },
      });
    } else {
      console.log(generatedOTP, "is recovery OTP");
    }

    const generatedForgetToken = jwtForgetToken({
      email,
      tokenType: "forget-token",
    });

    return res.status(201).json({
      data: {
        forgetToken: generatedForgetToken,
      },
      message: "OTP send to your email successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.forgetPasswordOtpVerification = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    expressValidation(req);
    const { type: requestTypeQuery } = req.query;

    if (requestTypeQuery === "verify") {
      const { email, newPassword, otp } = req.body;

      const date5MinutesAgo = date5MinutesAgoFn();
      const otpData = await Otp.findOne({
        // otp,
        userEmail: email,
        useFor: RESET_PASSWORD_OTP,
        isVerified: false,
        createdAt: { $gte: date5MinutesAgo },
      })
        .sort({ createdAt: -1 })
        .session(session);

      if (!otpData) {
        const error = new Error("OTP is invalid or expired");
        error.status = 422;
        throw error;
      }

      // only validate last otp
      if (otpData.otp != otp) {
        const error = new Error("OTP is invalid or expired");
        error.status = 422;
        throw error;
      }

      const newPasswordHash = await hashPassword(newPassword);

      const user = await User.findOneAndUpdate(
        { email },
        { password: newPasswordHash },
        { new: true, session }
      );

      if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
      }

      otpData.isVerified = true;
      await otpData.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        data: { user: user.toClient(), jwtToken: jwtSignToken({ email }) },
        message: "Account recovered successfully and your new password is set",
      });
    } else if (requestTypeQuery === "resend") {
      const { email } = req.body;

      const date5MinutesAgo = date5MinutesAgoFn();

      const otpsData = await Otp.find({
        userEmail: email,
        useFor: RESET_PASSWORD_OTP,
        isVerified: false,
        createdAt: { $gte: date5MinutesAgo },
      }).session(session);

      if (otpsData.length >= 3) {
        const error = new Error(
          "We have already sent 3 OTPs in last 5 minutes to your email, please check your email and try again"
        );
        error.status = 429;
        throw error;
      }

      const generatedOTP = generateSecureOTP();
      const year = new Date().getFullYear().toString();

      const otpData = new Otp({
        otp: generatedOTP,
        userEmail: email,
        useFor: RESET_PASSWORD_OTP,
      });
      await otpData.save({ session });

      if (SERVER_ENV !== "DEV") {
        await addEmailInQueue(email, {
          templateType: RESEND_FORGET_PASSWORD_TEMPLATE,
          emailInfo: {
            email,
            otp: generatedOTP,
            year,
          },
        });
      } else {
        console.log(generatedOTP, "is new recovery OTP");
      }
      await session.commitTransaction();

      const generatedForgetToken = jwtForgetToken({
        email,
        tokenType: "forget-token",
      });

      return res.status(201).json({
        data: {
          forgetToken: generatedForgetToken,
        },
        message: "OTP resend to your email successfully",
      });
    }
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
