const router = require("express").Router();
const User = require("../model/user-model");
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken");

// middleWare
router.use((req, res, next) => {
  console.log("正在經過middleWare");
  next();
});

//Register Router
router.post("/register", async (req, res) => {
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const checkEmail = await User.findOne({ email: req.body.email });
  if (checkEmail) {
    res.send("信箱已註冊,請重新註冊新的");
    return;
  }
  let { username, email, password } = req.body;
  let newUser = new User({
    username,
    email,
    password,
  });
  console.log("用戶資訊", newUser);

  // 儲存到DB
  try {
    let saveUser = await newUser.save();
    return res.send({
      message: "已儲存到資料庫",
      saveUser,
    });
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

//Login Router
router.post("/login", async (req, res) => {
  console.log(req.body);
  let { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 確認有無使用者
  const checkUser = await User.findOne({ email: req.body.email });
  if (!checkUser) {
    return res.status(401).send("使用者不存在請重新註冊!!!!");
  }
  const isMatch = await checkUser.comparePassword(req.body.password);
  if (!isMatch) {
    return res.status(401).send("密碼錯誤");
  }
  const tokenObject = {
    _id: checkUser._id,
    username: checkUser.username,
    email: checkUser.email,
  };
  const token = jwt.sign(tokenObject, process.env.JWT_SECRET);
  return res.send({
    msg: "成功登入",
    token,
    user: checkUser,
  });
});

// 驗證使用者身分
router.get("/profile", verifyToken, async (req, res) => {
  console.log("Authorization:", req.header("Authorization"));
  console.log("JWT:", req.user);

  try {
    const user = await User.findById(req.user._id);

    console.log("查詢結果:", user);

    if (!user) {
      return res.status(404).send("找不到使用者");
    }

    return res.send({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
});

module.exports = router;
