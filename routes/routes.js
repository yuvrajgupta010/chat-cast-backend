// API routes
const authRoutes = require("./auth");
const userRoutes = require("./user");
const chatRoutes = require("./chat");

// error middleware
const errorMiddleware = require("@/middlewares/error");

///////////////////All initalization imports - start///////////////////////
// Passport
// require("@/configs/passport/socialAuth");
require("@/configs/passport/jwt");

// Redis
require("@/redis/bullMQ/worker");
require("@/configs/redis.js");
///////////////////All initalization imports - end///////////////////////

module.exports = function (app) {
  //Handling Routes
  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  app.use("/chat", chatRoutes);

  //Some error
  app.use((req, res, next) => {
    const error = new Error();
    error.status = 404;
    error.message = "404 NOT FOUND";
    next(error);
  });

  // Handle error
  app.use(errorMiddleware);
};
