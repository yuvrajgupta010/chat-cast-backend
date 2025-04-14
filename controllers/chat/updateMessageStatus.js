const { expressValidation } = require("@/helpers/validation");

const Message = require("@/models/message");

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

    return res.status(200).json({
      message: "Messages status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
