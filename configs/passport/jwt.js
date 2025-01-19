const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY; // Use environment variable in production

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
