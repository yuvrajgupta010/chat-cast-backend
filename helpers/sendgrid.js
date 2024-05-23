const sgMail = require("@sendgrid/mail");

const SENDGRID_VERIFIED_EMAIL = process.env.SENDGRID_VERIFIED_EMAIL;

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
    from: SENDGRID_VERIFIED_EMAIL,
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
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
