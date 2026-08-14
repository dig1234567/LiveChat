import React, { useState } from "react";
import authService from "../service/authService";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await authService.register({
        username,
        email,
        password,
      });
      console.log("註冊成功...");
    } catch (err) {
      console.log(err); // 開發者除錯
    }
  };

  return (
    <div>
      <form onSubmit={handleRegister}>
        <label htmlFor="username">用戶名稱</label>
        <input
          id="username"
          type="text"
          placeholder="英文名字或中文名字"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label htmlFor="email">電子信箱</label>
        <input
          id="email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">密碼</label>
        <input
          id="password"
          type="password"
          placeholder="長度至少 6 個字元"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">註冊會員</button>
      </form>
    </div>
  );
};

export default Register;
