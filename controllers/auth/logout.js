const { COOKIE_ACCESS_TOKEN, MAIN_APP_DOMAIN } = require("@/helpers/constant");

exports.logout = (req, res, next) => {
  try {
    // clear access token cookie
    const token = req.signedCookies[`${COOKIE_ACCESS_TOKEN}`];
    if (token) {
      res.clearCookie(COOKIE_ACCESS_TOKEN, {
        httpOnly: true,
        domain: MAIN_APP_DOMAIN,
        secure: SERVER_ENV !== "DEV",
        signed: true,
        path: "/",
        sameSite: "Strict",
      });
    }
    return res.status(200).json({
      message: "Your are successfully logged out!",
    });
  } catch (error) {
    next(error);
  }
};
