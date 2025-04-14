const { getChatList } = require("./getChatList.js");
const { getMessages } = require("./getMessages.js");
const { sendMessage } = require("./sendMessage.js");
const { updateMessageStatus } = require("./updateMessageStatus.js");
// const { deleteChat } = require("./deleteChat.js");
const { getUploadUrlForFile } = require("./getUploadUrlForFile.js");
const { getDownloadUrlForFile } = require("./getDownloadUrlForFile.js");

module.exports = {
  getChatList,
  getMessages,
  sendMessage,
  updateMessageStatus,
  // deleteChat,
  getUploadUrlForFile,
  getDownloadUrlForFile,
};
