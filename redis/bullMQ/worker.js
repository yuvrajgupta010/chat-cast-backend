const { Worker } = require("bullmq");
const ejs = require("ejs");
const path = require("path");

const {
  EMAIL_SERVICE_QUEUE,
  VIEW_FOLDER_PATH,
  SIGN_UP_TEMPLATE,
  WELCOME_TEMPLATE,
  WELCOME_WITH_SOCIAL_TEMPLATE,
  RESEND_OTP_TEMPLATE,
  FORGET_PASSWORD_TEMPLATE,
  RESEND_FORGET_PASSWORD_TEMPLATE,
  REDIS_HOST_ADDRESS,
  REDIS_HOST_PORT,
} = require("@/helpers/constant");
const { sendEmail } = require("@/helpers/zohoNodemailer");

// Environment variables
const STATIC_FILE_S3_ADDRESS = process.env.STATIC_FILE_S3_ADDRESS;
const MAIN_APP_DOMAIN = process.env.MAIN_APP_DOMAIN;

// Templates
const signupTemplatePath = path.join(VIEW_FOLDER_PATH, "signup.ejs");
const welcomeTemplatePath = path.join(VIEW_FOLDER_PATH, "welcome.ejs");
const resendOtpTemplate = path.join(VIEW_FOLDER_PATH, "resend-otp.ejs");
const forgetOtpTemplate = path.join(VIEW_FOLDER_PATH, "forget-otp.ejs");
const welcomeWithSocialTemplate = path.join(
  VIEW_FOLDER_PATH,
  "welcome-with-social.ejs"
);

const emailServiceWorker = new Worker(
  EMAIL_SERVICE_QUEUE,
  async (job) => {
    const jobData = job.data;
    // Email logic starting up
    try {
      let receiverEmail = null;
      let emailSubjectLine = null;
      let emailText = null;
      let generatedHTML = null;

      if (jobData.templateType === SIGN_UP_TEMPLATE) {
        generatedHTML = await ejs.renderFile(signupTemplatePath, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            fullName: jobData?.emailInfo?.fullName,
            otp: jobData?.emailInfo?.otp,
          },
          year: jobData?.emailInfo?.year,
        });

        receiverEmail = jobData?.emailInfo?.email;
        emailSubjectLine = "Sign up - Account Verification";
        emailText = `Thank you for signing up. Please verify your account using OTP ${jobData?.emailInfo?.otp}.`;
      } else if (jobData.templateType === WELCOME_TEMPLATE) {
        generatedHTML = await ejs.renderFile(welcomeTemplatePath, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            fullName: jobData?.emailInfo?.fullName,
          },
          year: jobData?.emailInfo?.year,
        });

        receiverEmail = jobData?.emailInfo?.email;
        emailSubjectLine = `Welcome, ${jobData?.emailInfo?.fullName}`;
        emailText = `Your account is verified successfully. We are happy to see you onboard!`;
      } else if (jobData.templateType === WELCOME_WITH_SOCIAL_TEMPLATE) {
        generatedHTML = await ejs.renderFile(welcomeWithSocialTemplate, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          authenticatedBy: jobData?.authenticatedBy,
          user: {
            fullName: jobData?.emailInfo?.fullName,
          },
          year: jobData?.emailInfo?.year,
        });

        receiverEmail = jobData?.emailInfo?.email;
        emailSubjectLine = `Welcome, ${jobData?.emailInfo?.fullName}`;
        emailText = `Your account created using ${jobData?.emailInfo?.authenticatedBy}. We are happy to see you onboard!`;
      } else if (jobData.templateType === RESEND_OTP_TEMPLATE) {
        generatedHTML = await ejs.renderFile(resendOtpTemplate, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            otp: jobData?.emailInfo?.otp,
          },
          year: jobData?.emailInfo?.year,
        });

        receiverEmail = jobData?.emailInfo?.email;
        emailSubjectLine = `Resended OTP for verification`;
        emailText = `${jobData?.emailInfo?.otp} is your new OTP for verification`;
      } else if (jobData.templateType === FORGET_PASSWORD_TEMPLATE) {
        generatedHTML = await ejs.renderFile(forgetOtpTemplate, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            otp: jobData?.emailInfo?.otp,
          },
          year: jobData?.emailInfo?.year,
        });

        receiverEmail = jobData?.emailInfo?.email;
        emailSubjectLine = `Forget OTP for account recovery`;
        emailText = `${jobData?.emailInfo?.otp} is your forget OTP for account recovery`;
      } else if (jobData.templateType === RESEND_FORGET_PASSWORD_TEMPLATE) {
        generatedHTML = await ejs.renderFile(forgetOtpTemplate, {
          staticFileDomain: STATIC_FILE_S3_ADDRESS,
          mainAppDomain: MAIN_APP_DOMAIN,
          user: {
            otp: jobData?.emailInfo?.otp,
          },
          year: jobData?.emailInfo?.year,
        });

        receiverEmail = jobData?.emailInfo?.email;
        emailSubjectLine = `Regenerated account recovery OTP`;
        emailText = `${jobData?.emailInfo?.otp} is your forget OTP for account recovery`;
      }

      return await sendEmail(
        receiverEmail,
        emailSubjectLine,
        emailText,
        generatedHTML
      );
    } catch (error) {
      console.error(JSON.stringify(error), "error in Bull MQ worker");
    }
  },
  {
    connection: {
      host: REDIS_HOST_ADDRESS,
      port: REDIS_HOST_PORT,
    },
  }
);
