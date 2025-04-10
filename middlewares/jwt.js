const {
  COOKIE_FORGET_TOKEN,
  MAIN_APP_DOMAIN,
  SERVER_ENV,
  JWT_FORGET_TOKEN_KEY,
} = require("@/helpers/constant");
const { jwtForgetTokenVerify } = require("@/helpers/jwt");

exports.forgetTokenVerification = async (req, res, next) => {
  const forgetToken = req.signedCookies[COOKIE_FORGET_TOKEN];
  if (!forgetToken) {
    const error = new Error("Forget token is required");
    error.status = 422;
    next(error);
    return;
  }

  let decodedPayload;
  try {
    decodedPayload = jwtForgetTokenVerify(forgetToken, JWT_FORGET_TOKEN_KEY);
  } catch (err) {
    const error = new Error(
      "Unauthorized access! Your token is invalid or expired."
    );
    error.status = 401;
    res.clearCookie(COOKIE_FORGET_TOKEN, {
      httpOnly: true,
      domain: SERVER_ENV !== "DEV" ? MAIN_APP_DOMAIN : "localhost",
      secure: SERVER_ENV !== "DEV",
      signed: true,
      path: "/",
      sameSite: "Strict",
    });
    next(error);
    return;
  }

  if (!decodedPayload) {
    const error = new Error("Token not contain required information");
    error.status = 422;
    res.clearCookie(COOKIE_FORGET_TOKEN, {
      httpOnly: true,
      domain: SERVER_ENV !== "DEV" ? MAIN_APP_DOMAIN : "localhost",
      secure: SERVER_ENV !== "DEV",
      signed: true,
      path: "/",
      sameSite: "Strict",
    });
    next(error);
    return;
  } else if (
    decodedPayload?.tokenType !== "forget-token" &&
    !(decodedPayload?.email?.length > 0)
  ) {
    const error = new Error("Token not contain required information");
    error.status = 422;
    next(error);
    return;
  }
  req.body.email = decodedPayload?.email;
  next();
};
