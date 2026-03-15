const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Server running");
});

/* =====================================================
   IN-MEMORY STORAGE
===================================================== */

const rooms = {};
const roomUsers = {};

/* =====================================================
   USER HELPERS
===================================================== */

// Add user
const addUser = (data) => {
  const { userId, name, roomId, host, presenter, socketId } = data;

  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];
  }

  // remove duplicate (reconnect case)
  roomUsers[roomId] = roomUsers[roomId].filter(
    (u) => u.userId !== userId
  );

  roomUsers[roomId].push({
    userId,
    name,
    host,
    presenter,
    socketId,
  });

  return roomUsers[roomId];
};

// Get user by socketId
const getUser = (socketId) => {
  for (const roomId in roomUsers) {
    const user = roomUsers[roomId].find(
      (u) => u.socketId === socketId
    );
    if (user) return user;
  }
  return null;
};

// Remove user
const removeUser = (socketId) => {
  let removedUser = null;
  let roomIdFound = null;

  for (const roomId in roomUsers) {
    const users = roomUsers[roomId];
    const user = users.find((u) => u.socketId === socketId);

    if (user) {
      removedUser = user;
      roomUsers[roomId] = users.filter(
        (u) => u.socketId !== socketId
      );
      roomIdFound = roomId;
      break;
    }
  }

  return { roomId: roomIdFound, user: removedUser };
};

/* =====================================================
   SOCKET CONNECTION
===================================================== */

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* ===============================
     USER JOIN ROOM
  =============================== */

  socket.on("userJoined", (data) => {
    const { roomId, userId, name } = data;

    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;

    const users = addUser({
      ...data,
      socketId: socket.id,
    });

    io.to(roomId).emit("userJoined", {
      success: true,
      users,
    });

    socket.broadcast
      .to(roomId)
      .emit("userJoinedMessageBroadcasted", name);

    // Send existing whiteboard if exists
    if (rooms[roomId]) {
      socket.emit("whiteboardDataResponse", {
        imgURL: rooms[roomId],
      });
    }
  });

  /* ===============================
     CHAT MESSAGE
  =============================== */

  socket.on("message", (data) => {
    const { message } = data;

    const user = getUser(socket.id);
    if (!user) return;

    const roomId = socket.roomId;

    io.to(roomId).emit("messageResponse", {
      message,
      name: user.name,
    });
  });

  /* ===============================
     WHITEBOARD
  =============================== */

  socket.on("whiteboardData", ({ imgURL }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    rooms[roomId] = imgURL;

    socket.to(roomId).emit("whiteboardDataResponse", {
      imgURL,
    });
  });

  socket.on("getWhiteboardData", ({ roomId }) => {
    if (rooms[roomId]) {
      socket.emit("whiteboardDataResponse", {
        imgURL: rooms[roomId],
      });
    }
  });

  /* ===============================
     DISCONNECT
  =============================== */

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const { roomId, user } = removeUser(socket.id);

    if (roomId && user) {
      io.to(roomId).emit("userLeft", {
        users: roomUsers[roomId] || [],
      });

      io.to(roomId).emit(
        "userLeftMessageBroadcasted",
        user.name
      );

      if (!roomUsers[roomId] || roomUsers[roomId].length === 0) {
        delete roomUsers[roomId];
        delete rooms[roomId];
        console.log(`Room ${roomId} cleaned up`);
      }
    }
  });
});

/* =====================================================
   START SERVER
===================================================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${5000}`);
});