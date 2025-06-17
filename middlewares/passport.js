const passport = require("passport");
const {
  COOKIE_ACCESS_TOKEN,
  MAIN_APP_DOMAIN,
  SERVER_ENV,
  COOKIE_DOMAIN,
} = require("@/helpers/constant");
const { authCookieConfig } = require("@/helpers/cookieConfig");

exports.passportJWT = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Customize the message based on the error info
      let message = null;

      if (info && info.name === "TokenExpiredError") {
        message = "Your token has expired. Please log in again.";
      } else if (info && info.name === "JsonWebTokenError") {
        message = "Invalid token. Please log in again.";
      } else {
        message = "Unauthorized";
      }

      res.clearCookie(
        COOKIE_ACCESS_TOKEN,
        authCookieConfig({ clearCookie: true })
      );

      return res.status(401).json({ message });
    }
    req.jwtPayload = user;
    next();
  })(req, res, next);
};
