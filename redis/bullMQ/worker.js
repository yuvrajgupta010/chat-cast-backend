const { Worker } = require("bullmq");
const ejs = require("ejs");
const path = require("path");

const {
  EMAIL_SERVICE_QUEUE,
  VIEW_FOLDER_PATH,
  SIGN_UP_TEMPLATE,
  WELCOME_TEMPLATE,
  RESEND_OTP_TEMPLATE,
  FORGET_PASSWORD_TEMPLATE,
  RESEND_FORGET_PASSWORD_TEMPLATE,
  REDIS_HOST_ADDRESS,
  REDIS_HOST_PORT,
} = require("@/helpers/constant");
const { sendEmail } = require("@/helpers/sendgrid");

// Environment variables
const STATIC_FILE_S3_ADDRESS = process.env.STATIC_FILE_S3_ADDRESS;
const MAIN_APP_DOMAIN = process.env.MAIN_APP_DOMAIN;

// Templates
const signupTemplatePath = path.join(VIEW_FOLDER_PATH, "signup.ejs");
const welcomeTemplatePath = path.join(VIEW_FOLDER_PATH, "welcome.ejs");
const resendOtpTemplate = path.join(VIEW_FOLDER_PATH, "resend-otp.ejs");
const forgetOtpTemplate = path.join(VIEW_FOLDER_PATH, "forget-otp.ejs");

const emailServiceWorker = new Worker(
  EMAIL_SERVICE_QUEUE,
  async (job) => {
    const jobData = job.data;
    // Email logic starting up
    try {
      if (jobData.templateType === SIGN_UP_TEMPLATE) {
        const generatedHTML = await ejs.renderFile(signupTemplatePath, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            fullName: jobData?.emailInfo?.fullName,
            otp: jobData?.emailInfo?.otp,
          },
          year: jobData?.emailInfo?.year,
        });

        return await sendEmail(
          jobData?.emailInfo?.email,
          "Sign up - Account Verification",
          `Thank you for signing up. Please verify your account using OTP ${jobData?.emailInfo?.otp}.`,
          generatedHTML
        );
      } else if (jobData.templateType === WELCOME_TEMPLATE) {
        const generatedHTML = await ejs.renderFile(welcomeTemplatePath, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            fullName: jobData?.emailInfo?.fullName,
          },
          year: jobData?.emailInfo?.year,
        });

        return await sendEmail(
          jobData?.emailInfo?.email,
          `Welcome, ${jobData?.emailInfo?.fullName}`,
          `Your account is verified successfully. We are happy to see you onboard!`,
          generatedHTML
        );
      } else if (jobData.templateType === RESEND_OTP_TEMPLATE) {
        const generatedHTML = await ejs.renderFile(resendOtpTemplate, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            otp: jobData?.emailInfo?.otp,
          },
          year: jobData?.emailInfo?.year,
        });

        return await sendEmail(
          jobData?.emailInfo?.email,
          `Resended OTP for verification`,
          `${jobData?.emailInfo?.otp} is your new OTP for verification`,
          generatedHTML
        );
      } else if (jobData.templateType === FORGET_PASSWORD_TEMPLATE) {
        const generatedHTML = await ejs.renderFile(forgetOtpTemplate, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            otp: jobData?.emailInfo?.otp,
          },
          year: jobData?.emailInfo?.year,
        });

        return await sendEmail(
          jobData?.emailInfo?.email,
          `Forget OTP for account recovery`,
          `${jobData?.emailInfo?.otp} is your forget OTP for account recovery`,
          generatedHTML
        );
      } else if (jobData.templateType === RESEND_FORGET_PASSWORD_TEMPLATE) {
        const generatedHTML = await ejs.renderFile(forgetOtpTemplate, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            otp: jobData?.emailInfo?.otp,
          },
          year: jobData?.emailInfo?.year,
        });

        return await sendEmail(
          jobData?.emailInfo?.email,
          `Regenerated account recovery OTP`,
          `${jobData?.emailInfo?.otp} is your regenerated forget OTP for account recovery`,
          generatedHTML
        );
      }
    } catch (error) {
      console.log(error, "error in Bull MQ worker");
    }
  },
  {
    connection: {
      host: REDIS_HOST_ADDRESS,
      port: REDIS_HOST_PORT,
    },
  }
);
