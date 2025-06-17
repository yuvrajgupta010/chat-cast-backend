const { jwtSignToken } = require("@/helpers/jwt");
const {
  COOKIE_ACCESS_TOKEN,
  MAIN_APP_DOMAIN,
  SERVER_ENV,
  ACCESS_TOKEN_EXPIRY_TIME,
  COOKIE_DOMAIN,
} = require("@/helpers/constant");
const { comparePassword } = require("@/helpers/bcrypt");
const { expressValidation } = require("@/helpers/validation");

// login
exports.login = async (req, res, next) => {
  try {
    expressValidation(req);

    const { email, password } = req.body;

    if (!req.user.isAccountVerified) {
      const error = new Error(
        "Account not verified, please verify your email first!"
      );
      error.status = 403;
      throw error;
    }

    const passwordResult = await comparePassword(password, req.user.password);

    if (!passwordResult) {
      const error = new Error("Invalid email or password");
      error.status = 400;
      throw error;
    }

    const token = jwtSignToken({ email, userId: req.user.id });
    const expires = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_TIME); // Setting expiration to 1 day from now

    res.cookie(COOKIE_ACCESS_TOKEN, token, {
      path: "/",
      domain: SERVER_ENV !== "DEV" ? COOKIE_DOMAIN : "localhost",
      secure: SERVER_ENV !== "DEV",
      expires,
      httpOnly: true,
      signed: true,
      sameSite: "None",
    });

    return res.status(200).json({
      data: {
        user: req.user.toClient(),
      },
    });
  } catch (error) {
    next(error);
  }
};
