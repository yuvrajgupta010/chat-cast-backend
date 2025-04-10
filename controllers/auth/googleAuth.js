const User = require("@/models/user");
const {
  ACCOUNT_CREATED_BY_GOOGLE,
  COOKIE_ACCESS_TOKEN,
  ACCESS_TOKEN_EXPIRY_TIME,
  SERVER_ENV,
  MAIN_APP_DOMAIN,
} = require("@/helpers/constant");
const { jwtSignToken } = require("@/helpers/jwt");

const googleAuth = async (req, res, next) => {
  // const { name, email } = req?.user?._json;
  // try {
  //   const findedUser = await User.findOne({ email });
  //   let savedUser;
  //   if (!findedUser) {
  //     const newUser = new User({
  //       name: name,
  //       email: email,
  //     });
  //     savedUser = await newUser.save();
  //   }
  //   const user = {
  //     email: findedUser?.email || email,
  //     _id: findedUser?._id || savedUser?._id,
  //   };
  //   const { accessToken } = jwtSignToken(user, "7d");
  //   res.cookie("accessToken", accessToken, {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: "none",
  //   });
  //   return res.redirect(process.env.GOOGLE_AUTH_SUCCESS_URL);
  // } catch (error) {
  //   next(error);
  // }
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
      return res.redirect(process.env.GOOGLE_AUTH_SUCCESS_URL);
    } else {
      if (user?.accountAuthType === ACCOUNT_CREATED_BY_GOOGLE) {
        const token = jwtSignToken({ email, userId: user.id });
        const expires = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_TIME); // Setting expiration to 1 day from now

        res.cookie(COOKIE_ACCESS_TOKEN, token, {
          path: "/",
          domain: SERVER_ENV !== "DEV" ? MAIN_APP_DOMAIN : "localhost",
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
