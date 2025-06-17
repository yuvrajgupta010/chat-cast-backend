const mongoose = require("mongoose");

const User = require("@/models/user");
const Otp = require("@/models/otp");
const { jwtSignToken, jwtForgetToken } = require("@/helpers/jwt");
const {
  RESET_PASSWORD_OTP,
  RESEND_FORGET_PASSWORD_TEMPLATE,
  COOKIE_ACCESS_TOKEN,
  MAIN_APP_DOMAIN,
  SERVER_ENV,
  COOKIE_FORGET_TOKEN,
  ACCESS_TOKEN_EXPIRY_TIME,
  FORGET_TOKEN_EXPIRY_TIME,
  COOKIE_DOMAIN,
} = require("@/helpers/constant");
const { hashPassword } = require("@/helpers/bcrypt");
const { generateSecureOTP } = require("@/helpers/otp");
const { addEmailInQueue } = require("@/helpers/bullMQ");
const { date5MinutesAgoFn } = require("@/helpers/date");
const { expressValidation } = require("@/helpers/validation");
const { authCookieConfig } = require("@/helpers/cookieConfig");

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

      const token = jwtSignToken({ email, userId: user._id.toString() });

      res.cookie(COOKIE_ACCESS_TOKEN, token, authCookieConfig({}));

      return res.status(200).json({
        data: { user: user.toClient() },
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

      res.cookie(
        COOKIE_FORGET_TOKEN,
        generatedForgetToken,
        authCookieConfig({})
      );

      return res.status(201).json({
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
