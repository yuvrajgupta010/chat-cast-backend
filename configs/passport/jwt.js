const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const { COOKIE_ACCESS_TOKEN } = require("@/helpers/constant");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

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
