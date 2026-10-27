require("dotenv").config();
const cors = require("cors");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./config/cloudinary");
const Message = require("./model/message-model");
const User = require("./model/user-model");
const PrivateMessage = require("./model/private-message-model");
const auth = require("./router/auth");
const jwt = require("jsonwebtoken");
const { verify } = require("crypto");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Router
app.use("/api/user", auth);

app.get("/", (req, res) => {
  res.send("🚀 LiveChat Backend is Running!");
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "livechat",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  }),
});

const upload = multer({
  storage,
});

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "沒有上傳圖片",
    });
  }
  res.json({
    imageUrl: req.file.path,
  });
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("資料庫連接成功!!");
  })
  .catch((err) => console.log(err));

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("沒有token"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Token 驗證失敗"));
  }
});

//在線人數
let onlineUsers = 0;
const users = {};

io.on("connection", (socket) => {
  console.log("有人連線:", socket.id);
  onlineUsers++;
  io.emit("online-users", onlineUsers);

  socket.on("typing", (data) => {
    socket.to(data.room).emit("typing", data.user);
  });
  // 加入房間
  socket.on("join-room", async (data) => {
    console.log("join-room被呼叫", {
      socketId: socket.id,
      username: socket.user.username,
      room: data.room,
    });
    const room = data.room;
    const user = socket.user.username;
    const userData = await User.findOne({ username: user });
    Object.keys(users).forEach((socketId) => {
      const u = users[socketId];

      if (String(u.userId) === String(socket.user._id) && u.room === room) {
        delete users[socketId];
      }
    });
    users[socket.id] = {
      socketId: socket.id,
      user,
      room,
      avatar: userData?.avatar || "",
      userId: userData._id,
    };
    socket.join(room);
    //處理重新整理USER不見的問題
    console.log("加入聊天室成功:", {
      username: user,
      userId: String(userData?._id),
      socketId: socket.id,
      room,
    });
    const roomUsers = Object.values(users).filter((u) => u.room === room);

    //處理重新整理USER不見的問題
    console.log(
      "即將廣播的 roomUsers:",
      roomUsers.map((u) => ({
        user: u.user,
        userId: String(u.userId),
        socketId: u.socketId,
      })),
    );
    io.to(room).emit("room-users", roomUsers);
    socket.emit("welcome", `歡迎加入 ${room}`);
    const messages = await Message.find({
      room: room,
    }).populate("replyTo");

    socket.emit("previous-messages", messages);

    io.to(room).emit("receive-message", {
      system: true,
      text: `${user} 加入聊天室`,
      time: new Date().toLocaleTimeString(),
    });
  });

  // 房間訊息
  socket.on("send-message", async (data) => {
    const { room, text, replyTo, avatar } = data;
    const user = socket.user.username;

    console.log("發送訊息的 Socket:", socket.id);
    console.log("發送訊息的登入者:", socket.user.username, socket.user._id);

    const messageData = {
      room,
      user,
      text,
      replyTo,
      avatar,
      time: new Date().toLocaleTimeString(),
      readBy: [],
    };

    const newMessage = new Message(messageData);

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "replyTo",
    );

    io.to(room).emit("receive-message", populatedMessage);
  });

  // 私訊傳送
  socket.on("send-private-message", async (data) => {
    const { receiverId, text, imageUrl } = data;

    console.log("送出私訊收到的 data:", data);
    console.log("目前登入者:", socket.user._id);

    const senderId = socket.user._id;

    const privateMessage = new PrivateMessage({
      sender: senderId,
      receiver: receiverId,
      text,
      time: new Date().toLocaleTimeString(),
      imageUrl,
    });

    await privateMessage.save();

    console.log("私訊已儲存", privateMessage);

    // 傳送給接收者
    const receiverSocket = Object.values(users).find(
      (u) => u.userId.toString() === receiverId.toString(),
    );

    if (receiverSocket) {
      io.to(receiverSocket.socketId).emit(
        "receive-private-message",
        privateMessage,
      );
    }

    // 將訊息同步回傳給傳送者
    socket.emit("receive-private-message", privateMessage);
  });

  // 前端要求取得某兩個使用者之間的訊息, Socket事件
  socket.on("get-private-messages", async (data) => {
    const { receiverId } = data;
    const senderId = socket.user._id;
    console.log("目前登入者 ID:", socket.user._id);
    console.log("選擇的對象 ID:", receiverId);

    const messages = await PrivateMessage.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    console.log("後端查到筆數:", messages.length);

    socket.emit("private-messages", messages);
  });

  socket.on("send-image", async (data) => {
    try {
      console.log("收到圖片事件");
      console.log(data);

      const { room, imageUrl } = data;
      const user = socket.user.username;

      const imageMessage = {
        room,
        user,
        imageUrl,
        time: new Date().toLocaleTimeString(),
        readBy: [],
      };

      const newMessage = new Message(imageMessage);

      await newMessage.save();

      io.to(room).emit("receive-message", newMessage);

      console.log("廣播成功");
    } catch (err) {
      console.log("send-image錯誤");
      console.log(err);
    }
  });

  socket.on("delete-message", async (messageId) => {
    try {
      await Message.findByIdAndDelete(messageId);

      io.emit("message-deleted", messageId);
      console.log("刪除訊息", messageId);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("edit-message", async ({ messageId, text }) => {
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        text,
        edited: true,
      },
      { new: true },
    );
    io.emit("message-edited", updatedMessage);
  });

  socket.on("leave-room", ({ room, user }) => {
    socket.leave(room);

    delete users[socket.id];

    const roomUsers = Object.values(users).filter((u) => u.room === room);

    io.to(room).emit("room-users", roomUsers);

    io.to(room).emit("receive-message", {
      system: true,
      text: `${user} 離開聊天室`,
      time: new Date().toLocaleTimeString(),
    });

    console.log(user, "離開", room);
  });

  socket.on("message-read", async (data) => {
    const { messageId, socketId } = data;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        $addToSet: {
          readBy: socketId,
        },
      },
      {
        new: true,
      },
    );

    if (!message) return;

    console.log(
      "訊息:",
      message._id,
      "已讀:",
      message.readBy.length,
      message.readBy,
    );

    io.emit("message-read", {
      messageId,
      readBy: message.readBy,
    });
  });

  socket.on("disconnect", () => {
    const currentUser = users[socket.id];

    if (currentUser) {
      const room = currentUser.room;
      const user = currentUser.user;

      delete users[socket.id];

      const sameUserStillOnline = Object.values(users).some(
        (u) => String(u.userId) === String(currentUser.userId),
      );

      const roomUsers = Object.values(users).filter((u) => u.room === room);

      io.to(room).emit("room-users", roomUsers);

      if (!sameUserStillOnline) {
        io.to(room).emit("receive-message", {
          system: true,
          text: `${currentUser.user} 離開聊天室`,
          time: new Date().toLocaleTimeString(),
        });
      }
    }

    onlineUsers--;

    io.emit("online-users", onlineUsers);
    console.log("有人離線!!", socket.id, currentUser?.user);
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
