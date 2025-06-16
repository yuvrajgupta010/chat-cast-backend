const User = require("@/models/user");
const {
  ACCOUNT_CREATED_BY_GOOGLE,
  COOKIE_ACCESS_TOKEN,
  ACCESS_TOKEN_EXPIRY_TIME,
  SERVER_ENV,
  MAIN_APP_DOMAIN,
  WELCOME_WITH_SOCIAL_TEMPLATE,
  COOKIE_DOMAIN,
} = require("@/helpers/constant");
const { jwtSignToken } = require("@/helpers/jwt");
const { addEmailInQueue } = require("@/helpers/bullMQ");

const googleAuth = async (req, res, next) => {
  const profile = req.user;
  const email = req.user.emails[0].value;
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

      const token = jwtSignToken({ email, userId: newUser._id.toString() });
      const expires = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_TIME); // Setting expiration to 1 day from now

      if (SERVER_ENV !== "DEV") {
        const year = new Date().getFullYear().toString();

        await addEmailInQueue(email, {
          templateType: WELCOME_WITH_SOCIAL_TEMPLATE,
          authenticatedBy: ACCOUNT_CREATED_BY_GOOGLE,
          emailInfo: {
            email,
            fullName: profile.displayName,
            year,
          },
        });
      } else {
        console.log(
          `${profile.displayName} is signed up with ${ACCOUNT_CREATED_BY_GOOGLE}`
        );
      }

      res.cookie(COOKIE_ACCESS_TOKEN, token, {
        path: "/",
        domain: SERVER_ENV !== "DEV" ? COOKIE_DOMAIN : "localhost",
        secure: SERVER_ENV !== "DEV",
        expires,
        httpOnly: true,
        signed: true,
        sameSite: "Strict",
      });

      return res.redirect(process.env.GOOGLE_AUTH_SUCCESS_URL);
    } else {
      if (user?.accountAuthType === ACCOUNT_CREATED_BY_GOOGLE) {
        const token = jwtSignToken({ email, userId: user.id });
        const expires = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_TIME); // Setting expiration to 1 day from now

        res.cookie(COOKIE_ACCESS_TOKEN, token, {
          path: "/",
          domain: SERVER_ENV !== "DEV" ? COOKIE_DOMAIN : "localhost",
          secure: SERVER_ENV !== "DEV",
          expires,
          httpOnly: true,
          signed: true,
          sameSite: "Strict",
        });

        return res.redirect(process.env.GOOGLE_AUTH_SUCCESS_URL);
      } else {
        const error = new Error(
          "Authentication failed, Your account not created using gmail!"
        );
        error.status = 401;
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = googleAuth;
