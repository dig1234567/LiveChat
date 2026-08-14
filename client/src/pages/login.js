import React, { useState } from "react";
import authService from "../service/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setCurrentUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await authService.login(email, password);
      const token = data.token;
      const user = data.user;
      localStorage.setItem("token", token);
      setCurrentUser(user);
      alert("登入成功");
      setTimeout(() => {
        navigate("/chat");
      }, 1000);
      console.log("token", token);
      console.log("user", user);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <label htmlFor="email">電子郵件</label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />

        <label htmlFor="password">密碼</label>

        <input
          id="password"
          type="password"
          placeholder="請輸入密碼"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">登入</button>
      </form>
    </div>
  );
};

export default Login;
