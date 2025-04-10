const GoogleStrategy = require("passport-google-oauth20").Strategy;
const googleAuth = require("@/controllers/auth/googleAuth");
const passport = require("passport");

const strategy = (app) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_AUTH_CALLBACK,
        scope: ["profile", "email"],
      },
      async function (accessToken, refreshToken, profile, done) {
        // const email = profile.emails[0].value;
        // try {
        //   const user = await User.findOne({ email: email });

        //   if (!user) {
        //     const newUser = new User({
        //       email: email,
        //       accountAuthType: ACCOUNT_CREATED_BY_GOOGLE,
        //       authenticator: {
        //         authenticatorName: ACCOUNT_CREATED_BY_GOOGLE,
        //         authenticationId: profile.id,
        //       },
        //       profile: {
        //         fullName: profile.displayName,
        //         profileImageURL: profile.photos[0].value,
        //       },
        //     });
        //     await newUser.save();
        //     return done(null, newUser);
        //   } else {
        //     if (user?.accountAuthType === ACCOUNT_CREATED_BY_GOOGLE) {
        //       return done(null, user);
        //     } else {
        //       const error = new Error(
        //         "Authentication failed, Your account not created using gmail!"
        //       );
        //       error.status = 401;
        //       throw error;
        //     }
        //   }
        // } catch (err) {
        //   done(err, false);
        // }
        console.log(profile);
        return done(null, profile);
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["email", "profile"],
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: process.env.GOOGLE_AUTH_FAILURE_URL,
    }),
    googleAuth
  );
};

module.exports = strategy;
