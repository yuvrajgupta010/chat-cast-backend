const passport = require("passport");

exports.passportJWT = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Customize the message based on the error info
      if (info && info.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Your token has expired. Please log in again." });
      } else if (info && info.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ message: "Invalid token. Please log in again." });
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
    req.jwtPayload = user;
    next();
  })(req, res, next);
};
