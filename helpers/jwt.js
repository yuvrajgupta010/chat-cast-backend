const JWT = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_FORGET_TOKEN_KEY = process.env.JWT_FORGET_TOKEN_KEY;

exports.jwtSignToken = (jwtPayloadData) => {
  return JWT.sign(jwtPayloadData, JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
};

exports.jwtForgetToken = (jwtPayloadData) => {
  return JWT.sign(jwtPayloadData, JWT_FORGET_TOKEN_KEY, {
    expiresIn: "5m",
  });
};

exports.jwtForgetTokenVerify = (jwtForgetToken) => {
  return JWT.verify(jwtForgetToken, JWT_FORGET_TOKEN_KEY);
};
