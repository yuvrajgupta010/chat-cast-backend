const Otp = require("@/models/otp");
const { jwtForgetToken } = require("@/helpers/jwt");
const {
  RESET_PASSWORD_OTP,
  FORGET_PASSWORD_TEMPLATE,

  SERVER_ENV,
} = require("@/helpers/constant");
const { generateSecureOTP } = require("@/helpers/otp");
const { addEmailInQueue } = require("@/helpers/bullMQ");
const { date5MinutesAgoFn } = require("@/helpers/date");
const { expressValidation } = require("@/helpers/validation");

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
