const express = require("express");
const path = require("path");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const { COOKIE_SECRET, SERVER_ENV } = require("@/helpers/constant");
const googleAuthStrategy = require("./passport/socialAuth");
const jwtAuthStrategy = require("./passport/jwt");
const session = require("express-session");
const redisClient = require("./redis");
const RedisStore = require("connect-redis").default;

// Initialize store.
let redisStore = new RedisStore({
  client: redisClient,
  prefix: "chat-cast:",
});

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
      store: redisStore,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: SERVER_ENV === "PROD" ? true : false, // set to true if using HTTPS
        sameSite: "None", // important for cross-origin
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
