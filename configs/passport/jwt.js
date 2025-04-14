const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const { COOKIE_ACCESS_TOKEN, JWT_SECRET_KEY } = require("@/helpers/constant");

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.signedCookies) {
    token = req.signedCookies[COOKIE_ACCESS_TOKEN];
  }
  return token;
};

const options = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    cookieExtractor,
    // ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]),
  secretOrKey: JWT_SECRET_KEY,
};

const jwtAuthStrategy = (app) => {
  passport.use(
    new Strategy(options, async (jwt_payload, done) => {
      const user = jwt_payload;
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
  );
};

module.exports = jwtAuthStrategy;
