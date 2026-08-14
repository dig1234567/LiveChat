// User Schema
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.methods.comparePassword = async function (password) {
  console.log("輸入密碼:", password, typeof password);
  console.log("資料庫密碼:", this.password, typeof this.password);
  return await bcrypt.compare(password, this.password);
};

// 若使用者為新用戶或正在更改密碼 , 則進行雜湊處理
userSchema.pre("save", async function () {
  // this 代表 mongodb document
  if (this.isNew || this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

module.exports = mongoose.model("User", userSchema);
