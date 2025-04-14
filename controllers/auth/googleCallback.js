const { jwtSignToken } = require("@/helpers/jwt");

exports.googleCallback = (req, res, next) => {
  const jwtToken = jwtSignToken({ email: req.user.email });
  return res.json({ userData: req.user.toClient(), jwtToken });
};
