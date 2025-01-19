const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    chatName: {
      type: String,
      required: [
        function () {
          return this.isGroupChat;
        },
        "For group chat, name is required",
      ],
    },
    isGroupChat: {
      type: Boolean,
      required: true,
    },
    admin: [{ type: Schema.ObjectId, ref: "User" }],
    creator: { type: Schema.ObjectId, ref: "User" },
    users: [{ type: Schema.ObjectId, ref: "User" }],
    chatDeletedFor: [{ type: Schema.ObjectId, ref: "User" }],
    lastMessage: {
      type: Schema.ObjectId,
      ref: "Message",
    },
    isGroupOpen: {
      type: Boolean,
      required: [
        function () {
          return this.isGroupChat;
        },
        "For group chat, isGroupOpen is required",
      ],
    },
    totalUnreadMessages: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
