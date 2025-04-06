const express = require("express");
const path = require("path");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");

const COOKIE_SECRET = process.env.COOKIE_SECRET;

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
  app.use(express.static(path.join(__dirname, "public")));
  app.use(cookieParser(COOKIE_SECRET));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(helmet());
  app.use(passport.initialize());
};
