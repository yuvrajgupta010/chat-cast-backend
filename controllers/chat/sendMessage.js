const { expressValidation } = require("@/helpers/validation");
const { checkIsUserOnline } = require("@/helpers/redis.js");
const { TEXT_MESSAGE, NOTIFICATION_MESSAGE } = require("@/helpers/constant.js");

const Chat = require("@/models/chat");
const Message = require("@/models/message");

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
