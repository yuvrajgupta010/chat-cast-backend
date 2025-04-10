const mongoose = require("mongoose");

const User = require("@/models/user");
const Otp = require("@/models/otp");
const {
  ACCOUNT_CREATED_BY_EMAIL,
  VERIFICATION_OTP,
  SIGN_UP_TEMPLATE,
  SERVER_ENV,
} = require("@/helpers/constant");
const { hashPassword } = require("@/helpers/bcrypt");
const { generateSecureOTP } = require("@/helpers/otp");
const { addEmailInQueue } = require("@/helpers/bullMQ");
const { expressValidation } = require("@/helpers/validation");

// user create account
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
    console.log(user?.toClient?.(), "==================");
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
    console.log("I am running -----------------");
    return res.status(201).json({
      data: { user: user.toClient() },
      message:
        "Account created successfully and ready for verification. Please check your email for OTP",
    });
  } catch (err) {
    console.log("I am aborting");
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
