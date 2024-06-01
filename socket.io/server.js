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
      socket.join(room.chatId); // all the chat rooms are joined
    });
    socket.join(userId);
    //////////////////////////

    // Notifying the users
    const listOfOnlineUsers = [];

    const joinerId = userId;
    for (const room of rooms) {
      const { receiverId, chatId: roomId } = room;
      const isReceiverOnline = await checkIsUserOnline(receiverId);
      // console.log(isReceiverOnline, userId);
      if (isReceiverOnline) {
        listOfOnlineUsers.push({ receiverId: receiverId, isReceiverOnline });
        socket.to(roomId).emit("user-online-status", {
          receiverId: joinerId,
          isReceiverOnline: true,
        });
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
      joinedRooms: rooms.map((room) => room.chatId),
    };

    await redisClient.set(
      `chat-cast:userId:${userId}`,
      JSON.stringify(dataForRedis)
    );
  });

  socket.on("join-new-chat", async (receiverId, roomId, data, cb) => {
    if (!receiverId || !roomId || !data) {
      socket.emit("error", { message: "Invalid data" });
    }
    const userId = socket.jwtPayload.userId;
    socket.join(roomId);

    const isReceiverOnline = await checkIsUserOnline(receiverId);
    cb({
      status: "success",
      isReceiverOnline: isReceiverOnline,
    });

    // updating response
    const redisResponse = await redisClient.get(
      `chat-cast:userId:${userId}` // room is userId of other user
    );
    let { joinedRooms } = JSON.parse(redisResponse);
    joinedRooms.push(roomId);
    joinedRooms = [...new Set(joinedRooms)];
    await redisClient.set(
      `chat-cast:userId:${userId}`,
      JSON.stringify({ joinedRooms })
    );
    ////////////////////////////////

    if (!isReceiverOnline) return;
    io.to(receiverId).emit("new-chat", data);
  });

  //TODO: need to think
  socket.on("join-a-room", async (roomId) => {
    if (!roomId) {
      socket.emit("error", { message: "Invalid data" });
    }
    const userId = socket.jwtPayload.userId;
    const redisResponse = await redisClient.get(
      `chat-cast:userId:${userId}` // room is userId of other user
    );
    let { joinedRooms } = JSON.parse(redisResponse);
    joinedRooms.push(roomId);
    joinedRooms = [...new Set(joinedRooms)];
    await redisClient.set(
      `chat-cast:userId:${userId}`,
      JSON.stringify({ joinedRooms })
    );
    socket.join(roomId);
  });

  socket.on("send-message", async (receiverId, roomId, data) => {
    if (!receiverId || !roomId || !data) {
      socket.emit("error", { message: "Invalid data" });
    }
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(roomId).emit("new-message", data);
  });

  socket.on("send-message:new-contact", async (receiverId, roomId, data) => {
    if (!receiverId || !roomId || !data) {
      socket.emit("error", { message: "Invalid data" });
    }
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(roomId).emit("new-message:new-contact", data);
  });

  socket.on("mark-message-read", async (receiverId, roomId) => {
    if (!receiverId || !roomId) {
      socket.emit("error", { message: "Invalid data" });
    }
    const userId = socket.jwtPayload.userId;

    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(roomId).emit("mark-message-read", { readerId: userId });
  });

  socket.on("typing:start", async (receiverId, roomId) => {
    if (!receiverId || !roomId) {
      socket.emit("error", { message: "Invalid data" });
    }
    const userId = socket.jwtPayload.userId;
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(roomId).emit("typing:start", { typerId: userId });
  });

  socket.on("typing:stop", async (receiverId, roomId) => {
    if (!receiverId || !roomId) {
      socket.emit("error", { message: "Invalid data" });
    }
    const userId = socket.jwtPayload.userId;
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket.to(roomId).emit("typing:stop", { typerId: userId });
  });

  socket.on("delete-chat:from-both-side", async (receiverId, roomId, data) => {
    const isReceiverOnline = await checkIsUserOnline(receiverId);
    if (!isReceiverOnline) return;
    socket
      .to(roomId)
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
        // Notify the other online users that the current user has left the room
        socket.to(room).emit("user-online-status", {
          receiverId: userId,
          isReceiverOnline: false,
        });
      }
    }

    // Remove the data from the redis connection
    await redisClient.del(`chat-cast:userId:${userId}`);
    ////////////////////////////
  });
};
