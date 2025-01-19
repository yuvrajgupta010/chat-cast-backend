const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../../models/user");
const { ACCOUNT_CREATED_BY_GOOGLE } = require("../../helpers/constant");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    async function (accessToken, refreshToken, profile, done) {
      const email = profile.emails[0].value;
      try {
        const user = await User.findOne({ email: email });

        if (!user) {
          const newUser = new User({
            email: email,
            accountAuthType: ACCOUNT_CREATED_BY_GOOGLE,
            authenticator: {
              authenticatorName: ACCOUNT_CREATED_BY_GOOGLE,
              authenticationId: profile.id,
            },
            profile: {
              fullName: profile.displayName,
              profileImageURL: profile.photos[0].value,
            },
          });
          await newUser.save();
          return done(null, newUser);
        } else {
          if (user?.accountAuthType === ACCOUNT_CREATED_BY_GOOGLE) {
            return done(null, user);
          } else {
            const error = new Error(
              "Authentication failed, Your account not created using gmail!"
            );
            error.status = 401;
            return done();
          }
        }
      } catch (err) {
        done(err, false);
      }
    }
  )
);
