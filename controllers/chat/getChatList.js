const { expressValidation } = require("@/helpers/validation");

const Chat = require("@/models/chat");
const Message = require("@/models/message");

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
        "email profile.fullName profile.profileImageURL profile.about accountAuthType"
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
        "email profile.fullName profile.profileImageURL profile.about accountAuthType"
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
