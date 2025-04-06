// const mongoose = require("mongoose");

// const { expressValidation } = require("../helpers/validation");
// const { checkIsUserOnline } = require("../helpers/redis.js");
// const { putS3ObjectURL, getS3ObectURL } = require("../helpers/awsS3.js");
// const {
//   TEXT_MESSAGE,
//   NOTIFICATION_MESSAGE,
// } = require("../helpers/constant.js");

// const Chat = require("../models/chat");
// const Message = require("../models/message");

// exports.deleteChat = async (req, res, next) => {
//   try {
//     expressValidation(req);

//     const { chatId } = req.body;
//     const {
//       jwtPayload: { email, userId },
//     } = req;

//     const chat = await Chat.findById(chatId);

//     if (!chat) {
//       return res.status(404).json({
//         message: "Chat not found",
//       });
//     }

//     const isChatAlreadyDeletedForUser =
//       chat.chatDeletedFor.findIndex((user) => user.toString() === userId) !==
//       -1;
//     if (isChatAlreadyDeletedForUser) {
//       const error = new Error("Chat already deleted");
//       error.statusCode = 400;
//       throw error;
//     }

//     if (chat.chatDeletedFor.length) {
//       const deleteChat = await Chat.deleteOne({ _id: chat._id });
//     } else {
//       chat.chatDeletedFor.push(userId);
//       await chat.save();
//     }

//     return res.status(200).json({
//       message: "Chat deleted successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };
