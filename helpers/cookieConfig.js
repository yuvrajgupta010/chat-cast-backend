const {
  SERVER_ENV,
  COOKIE_DOMAIN,
  FORGET_TOKEN_EXPIRY_TIME,
  ACCESS_TOKEN_EXPIRY_TIME,
} = require("./constant");

/**
 * Generates cookie configuration options for authentication tokens.
 *
 * @param {Date} [cookieExpiry=new Date(Date.now() + FORGET_TOKEN_EXPIRY_TIME)] -
 * Optional expiration date for the cookie. Defaults to 1 day from now based on FORGET_TOKEN_EXPIRY_TIME.
 * Ignored if `clearCookie` is true.
 *
 * @param {boolean} [clearCookie=false] -
 * If true, the `expires` property will be omitted to allow clearing the cookie (typically used with `res.clearCookie()`).
 *
 * @returns {Object} Cookie configuration object
 * @returns {string} return.path - The cookie path (set to root `/`)
 * @returns {string} return.domain - Cookie domain (`localhost` in development, otherwise `COOKIE_DOMAIN`)
 * @returns {boolean} return.secure - Indicates if the cookie should only be sent over HTTPS
 * @returns {Date|undefined} return.expires - Expiration date of the cookie, included only if `clearCookie` is false
 * @returns {boolean} return.httpOnly - Prevents client-side JavaScript from accessing the cookie
 * @returns {boolean} return.signed - Indicates that the cookie should be signed to prevent tampering
 * @returns {string} return.sameSite - SameSite policy to allow cross-site cookies (set to `"None"`)
 */
const authCookieConfig = ({ cookieExpiry, clearCookie = false }) => {
  let expires = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_TIME); // Setting expiration to 1 day from now
  if (cookieExpiry) {
    expires = cookieExpiry;
  }

  return {
    path: "/",
    domain: SERVER_ENV !== "DEV" ? COOKIE_DOMAIN : "localhost",
    secure: true,
    ...(!clearCookie && { expires }),
    httpOnly: true,
    signed: true,
    sameSite: "None",
  };
};

module.exports = {
  authCookieConfig,
};
