const authRoutes = require("./auth");
const userRoutes = require("./user");

///////////////////All initalization imports - start///////////////////////
// Passport
require("../configs/passport/socialAuth");
require("../configs/passport/jwt");
require("../configs/sendgrid");
// Redis
require("../redis/bullMQ/worker");
///////////////////All initalization imports - end///////////////////////

module.exports = function (app) {
  //Handling Routes
  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);

  //Some error
  app.use((req, res, next) => {
    const error = new Error();
    error.status = 404;
    error.message = "404 NOT FOUND";
    next(error);
  });
};
