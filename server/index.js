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
const auth = require("./router/auth");

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

//在線人數
let onlineUsers = 0;
const users = {};

io.on("connection", (socket) => {
  console.log("有人連線:", socket.id);
  onlineUsers++;
  io.emit("online-users", onlineUsers);
  // 加入房間
  socket.on("join-room", async (data) => {
    const { room, user } = data;
    users[socket.id] = {
      socketId: socket.id,
      user,
      room,
    };
    socket.join(room);
    const roomUsers = Object.values(users).filter((u) => u.room === room);
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
    const { room, user, text, replyTo } = data;
    console.log("replyTo", replyTo);
    console.log("socket rooms:", socket.rooms);
    const messageData = {
      room,
      user,
      text,
      replyTo,
      time: new Date().toLocaleTimeString(),
      readBy: [],
    };

    // 🔥 存 MongoDB
    const newMessage = new Message(messageData);

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "replyTo",
    );

    io.to(room).emit("receive-message", populatedMessage);
  });

  socket.on("send-image", async (data) => {
    try {
      console.log("收到圖片事件");
      console.log(data);

      const { room, user, imageUrl } = data;

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

      // 離開聊天室通知
      io.to(room).emit("receive-message", {
        system: true,
        text: `${user} 離開聊天室`,
        time: new Date().toLocaleTimeString(),
      });

      delete users[socket.id];

      const roomUsers = Object.values(users).filter((u) => u.room === room);

      io.to(room).emit("room-users", roomUsers);
    }

    onlineUsers--;

    io.emit("online-users", onlineUsers);
    console.log("有人離線!!");
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
