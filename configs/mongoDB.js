const mongoose = require("mongoose");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@chat-cast.pln1iiu.mongodb.net/chat-cast?retryWrites=true&w=majority&appName=chat-cast`;
// const MONGODB_URI = `mongodb://localhost:27017/chat-cast`;

const mongoDBConnection = mongoose
  .connect(MONGODB_URI)
  .then((connection) => connection);

module.exports = {
  MONGODB_URI,
  mongoDBConnection,
};
