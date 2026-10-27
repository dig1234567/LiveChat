const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: "",
  },
  time: {
    type: String,
  },
  readBy: {
    type: [String],
    default: [],
  },
  edited: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
  avatar: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Message", messageSchema);
