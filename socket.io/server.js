const redisClient = require("../configs/redis.js");
const { checkIsUserOnline } = require("../helpers/redis.js");

module.exports = function (io, socket) {
  socket.on("join-rooms-and-show-online", async (data) => {
    if (!data || !Array.isArray(data.rooms)) {
      return socket.emit("error", { message: "Invalid rooms data" });
    }
    const rooms = data.rooms;
    const userId = socket.jwtPayload.userId;

    // join the rooms
    rooms.forEach((room) => {
      socket.join(room); // all the other room
    });
    socket.join(userId); // own room
    //////////////////////////

    // Notifying the users
    const listOfOnlineUsers = [];

    for (const userId of rooms) {
      const isReceiverOnline = await checkIsUserOnline(userId);
      if (isReceiverOnline) {
        listOfOnlineUsers.push(userId);
        socket
          .to(userId)
          .emit("user-online-status", { userId, status: "online" });
      }
    }
    ////////////////////////////

    // Send the list of online users to the current user
    socket.emit("online-users", {
      onlineUsers: listOfOnlineUsers,
    });
    ////////////////////////////////////////

    // Save the data in redis for future use in communitcation
    const dataForRedis = {
      joinedRooms: rooms,
    };

    await redisClient.set(
      `chat-cast:userId:${userId}`,
      JSON.stringify(dataForRedis)
    );
  });

  socket.on("send-message", async (receiverId, data) => {
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(receiverId).emit("new-message", data);
  });

  socket.on("send-message:new-contact", async (receiverId, data) => {
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(receiverId).emit("new-message:new-contact", data);
  });

  socket.on("mark-message-read", async (receiverId) => {
    const userId = socket.jwtPayload.userId;

    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(receiverId).emit("mark-message-recieve", { readerId: userId });
  });

  socket.on("typing:start", async (receiverId) => {
    const userId = socket.jwtPayload.userId;
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(receiverId).emit("typing:start", { typerId: userId });
  });

  socket.on("typing:stop", async (receiverId) => {
    const userId = socket.jwtPayload.userId;
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(receiverId).emit("typing:stop", { typerId: userId });
  });

  socket.on("delete-chat:from-both-side", async (receiverId, data) => {
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket
      .to(receiverId)
      .emit("delete-chat:from-both-side", { chatId: data.chatId });
  });

  socket.on("disconnect", async () => {
    // Notifying the other users for disconnection
    const userId = socket.jwtPayload.userId;

    const getUserJoinedRooms = await redisClient.get(
      `chat-cast:userId:${userId}`
    );
    if (getUserJoinedRooms) {
      const { joinedRooms } = JSON.parse(getUserJoinedRooms);
      for (const room of joinedRooms) {
        const otherOnlineUser = await redisClient.get(
          `chat-cast:userId:${room}` // room is userId of other user
        );
        if (otherOnlineUser) {
          // Notify the other online users that the current user has left the room
          socket
            .to(room)
            .emit("user-online-status", { userId, status: "offline" });
        }
      }
    }

    // Remove the data from the redis connection
    await redisClient.del(`chat-cast:userId:${userId}`);
    ////////////////////////////
  });
};
