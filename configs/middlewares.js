const express = require("express");
const path = require("path");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { COOKIE_SECRET } = require("@/helpers/constant");
const googleAuthStrategy = require("./passport/socialAuth");
const jwtAuthStrategy = require("./passport/jwt");

module.exports = function (app, origins) {
  app.use(
    cors({
      origin: origins,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    })
  );
  app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: true,
      cookie: {
        httpOnly: true,
        secure: true, // set to true if using HTTPS
        sameSite: "none", // important for cross-origin
      },
    })
  );
  app.use(express.static(path.join(__dirname, "public")));
  app.use(cookieParser(COOKIE_SECRET));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(helmet());
  app.use(passport.initialize());
  jwtAuthStrategy(app);
  googleAuthStrategy(app);
};
