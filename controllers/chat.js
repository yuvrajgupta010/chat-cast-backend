const mongoose = require("mongoose");

const { expressValidation } = require("../helpers/validation");
const { checkIsUserOnline } = require("../helpers/redis.js");
const { putS3ObjectURL, getS3ObectURL } = require("../helpers/awsS3.js");
const {
  TEXT_MESSAGE,
  NOTIFICATION_MESSAGE,
} = require("../helpers/constant.js");

const Chat = require("../models/chat");
const Message = require("../models/message");

exports.getChatList = async (req, res, next) => {
  try {
    expressValidation(req);
    const {
      jwtPayload: { email, userId },
    } = req;

    const chatList = await Chat.find({
      $and: [
        {
          users: { $elemMatch: { $eq: userId } },
        },
        {
          isGroupChat: false,
        },
        {
          chatDeletedFor: { $nin: [userId] },
        },
      ],
    })
      .sort({ updatedAt: -1 }) // Sort by updatedAt in descending order (most recent first)
      .select({ chatName: 0, creator: 0, isGroupOpen: 0 })
      .populate("lastMessage")
      .populate(
        "users",
        "email profile.fullName profile.profileImageURL profile.about"
      )
      .exec();

    const deletedChatList = await Chat.find({
      $and: [
        {
          users: { $elemMatch: { $eq: userId } },
        },
        {
          isGroupChat: false,
        },
        {
          chatDeletedFor: { $in: [userId] },
        },
      ],
    })
      .select({ chatName: 0, creator: 0, isGroupOpen: 0 })
      .populate("lastMessage")
      .populate(
        "users",
        "email profile.fullName profile.profileImageURL profile.about"
      )
      .exec();

    // Find unread messages
    if (chatList.length > 0) {
      const filteredChatList = chatList.filter((chat) => {
        return chat?.lastMessage?.sender?.toString() !== userId;
      });
      const chatIds = filteredChatList.map((chat) => chat.id);

      const unreadMessages = await Message.find({
        $and: [
          { chat: { $in: chatIds } },
          { messageStatus: { $in: ["sent", "delivered"] } },
        ],
      }).select({ chat: 1, _id: 1, messageStatus: 1, sender: 1 });

      if (unreadMessages.length > 0) {
        const undeliveredMessage = unreadMessages.filter(
          (message) => message.messageStatus === "sent"
        );

        if (undeliveredMessage.length > 0) {
          const idsOfUndeliveredMessages = undeliveredMessage.map(
            (message) => message._id
          );

          await Message.updateMany(
            { _id: { $in: idsOfUndeliveredMessages } },
            { $set: { messageStatus: "delivered" } }
          );
        }

        // counting messages
        for (let i = 0; i < chatList.length; i++) {
          const chat = chatList[i];

          // user is last sender
          const isUserLastSender =
            chat?.lastMessage?.sender?.toString() === userId;
          if (isUserLastSender) {
            continue;
          }
          // user is not last sender
          const countUnreadMessages = unreadMessages.filter((message) => {
            return (
              message.chat.toString() === chat.id &&
              message.sender.toString() !== userId
            );
          });
          if (countUnreadMessages.length > 0) {
            chat.totalUnreadMessages = countUnreadMessages.length;
          }
        }
      }
    }

    const reponseData = {
      chatList,
      deletedChatList,
    };
    return res.status(200).json({
      data: reponseData,
      message: "Chat list fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    expressValidation(req);
    const {
      jwtPayload: { email, userId },
    } = req;

    const { chatId } = req.params;
    const { offset = 1, limit = 12 } = req.query;
    const parsedOffset = parseInt(offset, 10);
    const parsedLimit = parseInt(limit, 10);

    const noOfSkip = (parsedOffset - 1) * limit;

    const messages = await Message.find({
      $and: [{ chat: chatId }, {}],
    })
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1) // +1 because we want to know the message is end or not
      .skip(noOfSkip);

    const hasMoreMessages = messages.length > limit;
    if (hasMoreMessages) {
      messages.pop();
    }

    const responseData = {
      messages,
      hasMoreMessages,
    };

    return res.status(200).json({
      data: responseData,
      message: "Messages fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

//TODO: Add tranction
exports.sendMessage = async (req, res, next) => {
  try {
    expressValidation(req);
    const {
      jwtPayload: { email, userId },
    } = req;

    const { receiverId, messageType, messageContent } = req.body;

    let chat = await Chat.findOne({
      isGroupChat: false,
      users: {
        $size: 2,
        $all: [receiverId, userId],
      },
    });

    let isChatNew = false;
    if (!chat) {
      isChatNew = true;
      chat = await Chat.create({
        isGroupChat: false,
        users: [receiverId, userId],
        creator: userId,
      });
      chat.populate(
        "users",
        "email profile.fullName profile.profileImageURL profile.about"
      );
    }

    if (chat.chatDeletedFor.length > 0) {
      chat.chatDeletedFor = [];
    }

    const isReceiverOnline = await checkIsUserOnline(receiverId);

    const messageData = {
      chat: chat._id,
      sender: userId,
      messageType,
      messageContent,
      messageStatus: "sent",
    };

    if (isReceiverOnline) {
      messageData.messageStatus = "delivered";
    }
    if (messageType !== TEXT_MESSAGE && messageType !== NOTIFICATION_MESSAGE) {
      messageData.filePath = req.body.filePath;
    }

    const message = await Message.create(messageData);

    chat.lastMessage = message;
    chat.save();

    const responseData = {
      message,
      chatIsNew: false,
    };

    if (isChatNew) {
      responseData.chatIsNew = true;
      responseData.chat = chat;
      responseData.chat.lastMessage = message;
    }

    return res.status(201).json({
      data: responseData,
      message: "Message sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMessageStatus = async (req, res, next) => {
  try {
    expressValidation(req);
    const { chatId } = req.params;
    const { messageStatus = "read" } = req.body;
    const {
      jwtPayload: { email, userId },
    } = req;

    const message = await Message.updateMany(
      {
        $and: [
          { chat: chatId },
          { messageStatus: { $ne: messageStatus } },
          { sender: { $ne: userId } },
        ],
      },
      { $set: { messageStatus: messageStatus } }
    );
    console.log(message);
    return res.status(200).json({
      message: "Messages status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

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

exports.getUploadUrlForFile = async (req, res, next) => {
  try {
    expressValidation(req);
    const { fileName, contentType } = req.body;
    const {
      jwtPayload: { email, userId },
    } = req;

    const uploadKey = `upload/${userId}_${Math.random()}_${fileName}`;

    const signUrlForUpload = await putS3ObjectURL(uploadKey, contentType);

    return res.status(200).json({
      data: { presignedURL: signUrlForUpload, uploadPath: uploadKey },
      message: "Url generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getDownloadUrlForFile = async (req, res, next) => {
  try {
    const { s3_key } = req.body;
    const signDownloadUrl = await getS3ObectURL(s3_key);

    return res.status(200).json({
      data: { presignedURL: signDownloadUrl },
      message: "Download URL generated successfully",
    });
  } catch (error) {
    next(error);
  }
};
