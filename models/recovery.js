const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const recoverySchema = new Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recovery", recoverySchema);
