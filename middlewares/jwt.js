const {
  COOKIE_FORGET_TOKEN,
  JWT_FORGET_TOKEN_KEY,
} = require("@/helpers/constant");
const { authCookieConfig } = require("@/helpers/cookieConfig");
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
    res.clearCookie(
      COOKIE_FORGET_TOKEN,
      authCookieConfig({ clearCookie: true })
    );
    next(error);
    return;
  }

  if (!decodedPayload) {
    const error = new Error("Token not contain required information");
    error.status = 422;
    res.clearCookie(
      COOKIE_FORGET_TOKEN,
      authCookieConfig({ clearCookie: true })
    );
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
