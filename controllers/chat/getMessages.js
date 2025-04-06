const { expressValidation } = require("@/helpers/validation");

const Message = require("@/models/message");

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
