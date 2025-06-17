const mongoose = require("mongoose");

const User = require("@/models/user");
const Otp = require("@/models/otp");
const { jwtSignToken } = require("@/helpers/jwt");
const {
  VERIFICATION_OTP,
  WELCOME_TEMPLATE,
  RESEND_OTP_TEMPLATE,
  COOKIE_ACCESS_TOKEN,
  MAIN_APP_DOMAIN,
  SERVER_ENV,
  ACCESS_TOKEN_EXPIRY_TIME,
  COOKIE_DOMAIN,
} = require("@/helpers/constant");
const { generateSecureOTP } = require("@/helpers/otp");
const { addEmailInQueue } = require("@/helpers/bullMQ");
const { date5MinutesAgoFn } = require("@/helpers/date");
const { expressValidation } = require("@/helpers/validation");
const { authCookieConfig } = require("@/helpers/cookieConfig");

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

      if (SERVER_ENV !== "DEV") {
        const year = new Date().getFullYear().toString();
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

      const token = jwtSignToken({ email, userId: user.id });

      res.cookie(COOKIE_ACCESS_TOKEN, token, authCookieConfig({}));

      return res.status(200).json({
        data: {
          user: user.toClient(),
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
