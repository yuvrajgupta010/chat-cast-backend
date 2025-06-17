const { COOKIE_ACCESS_TOKEN } = require("@/helpers/constant");
const { authCookieConfig } = require("@/helpers/cookieConfig");

exports.logout = (req, res, next) => {
  try {
    // clear access token cookie
    const token = req.signedCookies[`${COOKIE_ACCESS_TOKEN}`];
    if (token) {
      res.clearCookie(
        COOKIE_ACCESS_TOKEN,
        authCookieConfig({ clearCookie: true })
      );
    }
    return res.status(200).json({
      message: "Your are successfully logged out!",
    });
  } catch (error) {
    next(error);
  }
};
