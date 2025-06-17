const { COOKIE_ACCESS_TOKEN, SERVER_ENV } = require("@/helpers/constant");
const { authCookieConfig } = require("@/helpers/cookieConfig");
const User = require("@/models/user");

exports.verifyUser = async (req, res, next) => {
  try {
    const {
      jwtPayload: { email, userId },
    } = req;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("Unauthorized!");
      error.status = 401;
      res.clearCookie(
        COOKIE_ACCESS_TOKEN,
        authCookieConfig({ clearCookie: true })
      );
      throw error;
    }

    return res.status(200).json({
      data: { user: user.toClient() },
      message: "OK!",
    });
  } catch (error) {
    next(error);
  }
};
