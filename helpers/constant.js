const path = require("path");

const VIEW_FOLDER_PATH = path.join(
  path.dirname(require.main.filename),
  "views"
);

module.exports = {
  // env
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
  RESEND_OTP_TEMPLATE: "resend-otp",
  FORGET_PASSWORD_TEMPLATE: "forget-password",
  RESEND_FORGET_PASSWORD_TEMPLATE: "resend-forget-password",
  // redis server
  EMAIL_SERVICE_QUEUE: "email-service-queue",
};
