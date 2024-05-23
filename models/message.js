const mongoose = require("mongoose");
const {
  PDF_FILE,
  IMAGE_FILE,
  AUDIO_FILE,
  VIDEO_FILE,
  TEXT_MESSAGE,
  NOTIFICATION_MESSAGE,
} = require("../helpers/constant");

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    chat: {
      type: Schema.ObjectId,
      ref: "Chat",
    },
    sender: {
      type: Schema.ObjectId,
      ref: "User",
    },
    messageType: {
      type: String,
      enum: [
        PDF_FILE,
        IMAGE_FILE,
        AUDIO_FILE,
        VIDEO_FILE,
        TEXT_MESSAGE,
        NOTIFICATION_MESSAGE,
      ],
      required: true,
    },
    messageContent: {
      type: String,
      required: true,
    },
    messageStatus: {
      type: String,
      enum: ["sent", "read", "delivered"],
      default: "sent",
    },
    filePath: {
      type: String,
      required: [
        function () {
          return this.messageType !== "text" || this.message !== "notification";
        },
        "file path is required if you're message is file",
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
