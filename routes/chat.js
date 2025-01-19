const express = require("express");
const { body, query, param } = require("express-validator");

const { passportJWT } = require("../middlewares/passport");
const chatController = require("../controllers/chat");
const { IMAGE_FILE, TEXT_MESSAGE } = require("../helpers/constant");

const router = express.Router();

router.get("/chat-list", passportJWT, chatController.getChatList);

router.get(
  "/:chatId",
  passportJWT,
  [
    param("chatId")
      .trim()
      .notEmpty()
      .isMongoId()
      .withMessage("Invalid MongoDB ObjectId"),
    query("offset")
      .notEmpty()
      .isNumeric()
      .withMessage("Offset must be a number"),
    query("limit").notEmpty().isNumeric().withMessage("Limit must be a number"),
  ],
  chatController.getMessages
);

router.post(
  "/send-message",
  passportJWT,
  [
    body("receiverId")
      .trim()
      .notEmpty()
      .isMongoId()
      .withMessage("Invalid MongoDB ObjectId"),
    body("messageType")
      .trim()
      .notEmpty()
      .isIn(["text", "image", "audio", "video", "notification"])
      .withMessage("Invalid message type"),
    body("messageContent")
      .trim()
      .notEmpty()
      .withMessage("Please provide message content"),
    body("filePath")
      .if((value, { req }) => req.body.messageType !== TEXT_MESSAGE)
      .trim()
      .notEmpty()
      .withMessage("Please provide file path"),
  ],
  chatController.sendMessage
);

//TODO: add validation
router.post(
  "/update-message-status/:chatId",
  passportJWT,
  [
    param("chatId")
      .trim()
      .notEmpty()
      .isMongoId()
      .withMessage("Invalid MongoDB ObjectId"),
  ],
  chatController.updateMessageStatus
);

// router.delete(
//   "/delete-chat",
//   passportJWT,
//   [
//     body("chatId")
//       .trim()
//       .notEmpty()
//       .isMongoId()
//       .withMessage("Invalid MongoDB ObjectId"),
//   ],
//   chatController.deleteChat
// );

router.post(
  "/get-upload-url",
  passportJWT,
  [
    body("fileName").trim().notEmpty().withMessage("Please provide file name"),
    body("contentType")
      .trim()
      .notEmpty()
      .withMessage("Please provide content type")
      .isIn([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "application/pdf",
        "audio/mpeg",
        "video/mp4",
        "video/mpeg",
        "video/webm",
        "text/plain",
      ])
      .withMessage("Please provide valid file type"),
  ],
  chatController.getUploadUrlForFile
);

router.post(
  "/get-download-url",
  passportJWT,
  [body("s3_key").trim().notEmpty().withMessage("Please provide s3 key")],
  chatController.getDownloadUrlForFile
);

module.exports = router;
