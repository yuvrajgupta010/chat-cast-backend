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
const { REDIS_HOST_ADDRESS, REDIS_HOST_PORT } = require("./helpers/constant");

const app = express();
const PORT = process.env.PORT || 8080;

//allowed origins
let origins;
if (process.env.SERVER_ENV === "PROD") {
  origins = [
    "http://chat-cast.personal.yuvrajgupta.in",
    "https://chat-cast.personal.yuvrajgupta.in",
  ];
} else {
  origins = ["http://localhost:5173", "http://localhost:3000"];
}

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
const pubClient = new Redis({
  port: REDIS_HOST_PORT, // Redis port
  host: REDIS_HOST_ADDRESS, // Redis host
  username: "default", // needs Redis >= 6
});
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
