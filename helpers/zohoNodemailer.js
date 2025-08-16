const nodeMailer = require("nodemailer");
const ZOHO_EMAIL = process.env.ZOHO_EMAIL;
const ZOHO_EMAIL_APP_PASSWORD = process.env.ZOHO_EMAIL_APP_PASSWORD;

let transporter = nodeMailer.createTransport({
  host: "smtp.zoho.in",
  secure: true,
  port: 465,
  auth: {
    user: ZOHO_EMAIL,
    pass: ZOHO_EMAIL_APP_PASSWORD,
  },
});

/**
 * Sends an email using SendGrid.
 * @param {string} to Recipient email address.
 * @param {string} subject Email subject.
 * @param {string} text Plain text content of the email.
 * @param {string} html HTML content of the email.
 * @returns {Promise<void>} A promise that resolves when the email is sent.
 */
const sendEmail = async (to, subject, text, html) => {
  const msg = {
    to,
    from: ZOHO_EMAIL,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(msg);
    // console.log("Email sent successfully");
  } catch (error) {
    // console.error("Error sending email:", error);
    // if (error.response) {
    //   console.error("Error response body:", error.response.body);
    // }
    throw error; // Rethrow to handle the error further up in your application if needed.
  }
};

module.exports = { sendEmail };
