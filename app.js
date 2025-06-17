// library
require("dotenv").config();
require("module-alias/register");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const signature = require("cookie-signature");
const cookie = require("cookie");
const { createShardedAdapter } = require("@socket.io/redis-adapter");
const redisClient = require("./configs/redis");

// helper or util
const date = require("./helpers/date");

// config
const { mongoDBConnection } = require("./configs/mongoDB");
const { jwtVerifyToken } = require("./helpers/jwt");
const {
  REDIS_HOST_ADDRESS,
  REDIS_HOST_PORT,
  COOKIE_ACCESS_TOKEN,
  COOKIE_SECRET,
} = require("./helpers/constant");
const middlewares = require("./configs/middlewares");

// APIs
const apiRoutes = require("./routes/routes");

// ENV import
const PORT = process.env.PORT || 8080;
const MAIN_APP_DOMAIN = process.env.MAIN_APP_DOMAIN;

const app = express();

//allowed origins
let origins;
if (process.env.SERVER_ENV === "PROD") {
  origins = [`http://${MAIN_APP_DOMAIN}`, `https://${MAIN_APP_DOMAIN}`];
} else {
  origins = ["http://localhost:5173", "http://localhost:3000"];
}

middlewares(app, origins);

// server health check
app.get("/health-check", (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: date.START_TIME,
  };
  res.json(healthCheck);
});

apiRoutes(app);

const httpServer = http.createServer(app);

const io = socketIo(httpServer, {
  cors: {
    origin: origins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 2 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  },
});

// Create Redis clients for pub and sub using ioredis
const pubClient = redisClient;
const subClient = pubClient.duplicate();

// Use the Redis adapter
io.adapter(createShardedAdapter(pubClient, subClient));

pubClient.on("error", (err) => {
  console.error("Redis error in app.js:", err);
});

io.use((socket, next) => {
  const rawCookieHeader = socket.handshake.headers.cookie;

  if (!rawCookieHeader) return next(new Error("No cookies found"));

  const cookies = cookie.parse(rawCookieHeader);
  let signedAccessToken = cookies[COOKIE_ACCESS_TOKEN];

  if (!signedAccessToken) return next(new Error("No access token in cookies"));

  if (signedAccessToken.startsWith("s:")) {
    signedAccessToken = signedAccessToken.slice(2); // remove "s:"
    const unsignedToken = signature.unsign(signedAccessToken, COOKIE_SECRET);

    jwtVerifyToken(unsignedToken, (err, jwtPayload) => {
      if (err) return next(new Error("Authentication error"));
      socket.jwtPayload = jwtPayload;
      next();
    });
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => require("./socket.io/server")(io, socket));

mongoDBConnection
  .then(() => {
    httpServer.listen(PORT);
    console.log(`I am running on PORT: ${PORT}...`);
  })
  .catch((err) => {
    console.log(err);
  });
