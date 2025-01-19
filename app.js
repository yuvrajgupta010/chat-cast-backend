// library
require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const socketIo = require("socket.io");
const { createShardedAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

// helper or util
const date = require("./helpers/date");

// middleware
const errorMiddleware = require("./middlewares/error");

// config
const { mongoDBConnection } = require("./configs/mongoDB");
const { jwtVerifyToken } = require("./helpers/jwt");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://chat-cast.personal.yuvrajgupta.in",
      "https://chat-cast.personal.yuvrajgupta.in",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet());
app.use(passport.initialize());

// server health check
app.get("/health-check", (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: date.START_TIME,
  };
  res.json(healthCheck);
});

require("./routes/routes")(app);
app.use(errorMiddleware);

const httpServer = http.createServer(app);

const io = socketIo(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://chat-cast.personal.yuvrajgupta.in",
      "https://chat-cast.personal.yuvrajgupta.in",
    ],
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
const pubClient = new Redis();
const subClient = pubClient.duplicate();

// Use the Redis adapter
io.adapter(createShardedAdapter(pubClient, subClient));

pubClient.on("error", (err) => {
  console.error("Redis error in app.js:", err);
});

io.use((socket, next) => {
  let accessToken;
  // if (process.env.SERVER_ENV === "DEV") {
  //   accessToken = socket.handshake.query.accessToken;
  // } else {
  accessToken = socket.handshake.auth.accessToken;
  // }
  if (accessToken) {
    jwtVerifyToken(accessToken, (err, jwtPayload) => {
      if (err) {
        return next(new Error("Authentication error"));
      }
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
