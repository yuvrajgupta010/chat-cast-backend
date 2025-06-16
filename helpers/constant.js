const path = require("path");

const VIEW_FOLDER_PATH = path.join(
  path.dirname(require.main.filename),
  "views"
);
module.exports = {
  // main domain
  MAIN_APP_DOMAIN: process.env.MAIN_APP_DOMAIN,
  // Server enviroment
  SERVER_ENV: process.env.SERVER_ENV,
  // env
  REDIS_HOST_ADDRESS: process.env.REDIS_HOST_ADDRESS,
  REDIS_HOST_PORT: process.env.REDIS_HOST_PORT,
  // for sign up and authentication
  ACCOUNT_CREATED_BY_EMAIL: "email",
  ACCOUNT_CREATED_BY_FACEBOOK: "facebook",
  ACCOUNT_CREATED_BY_GOOGLE: "google",
  // for OTP
  RESET_PASSWORD_OTP: "reset password",
  VERIFICATION_OTP: "verification",
  // for message
  PDF_FILE: "pdf",
  IMAGE_FILE: "image",
  AUDIO_FILE: "audio",
  VIDEO_FILE: "video",
  TEXT_MESSAGE: "text",
  NOTIFICATION_MESSAGE: "notification",
  // view template
  VIEW_FOLDER_PATH,
  /////////// view template - template types
  SIGN_UP_TEMPLATE: "signup",
  WELCOME_TEMPLATE: "welcome",
  WELCOME_WITH_SOCIAL_TEMPLATE: "welcome-with-social",
  RESEND_OTP_TEMPLATE: "resend-otp",
  FORGET_PASSWORD_TEMPLATE: "forget-password",
  RESEND_FORGET_PASSWORD_TEMPLATE: "resend-forget-password",
  // redis server
  EMAIL_SERVICE_QUEUE: "email-service-queue",
  // cookies name
  COOKIE_ACCESS_TOKEN: "accessToken",
  ACCESS_TOKEN_EXPIRY_TIME: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  COOKIE_FORGET_TOKEN: "forgetToken",
  FORGET_TOKEN_EXPIRY_TIME: 5 * 60 * 1000, // 1 day in milliseconds
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  // AWS S3
  STATIC_FILE_S3_ADDRESS: process.env.STATIC_FILE_S3_ADDRESS,
  // JWT auth
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  JWT_FORGET_TOKEN_KEY: process.env.JWT_FORGET_TOKEN_KEY,
};
