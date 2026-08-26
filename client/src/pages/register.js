import React, { useState } from "react";
import "./auth.css";
import authService from "../service/authService";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

      toast.success("註冊成功");

      navigate("/");
    } catch (err) {
      console.log(err);
      toast.error("註冊失敗");
    }
  };

  return (
    <div className="login-page">
      {/* 左側 */}
      <div className="login-left">
        <div className="logo">💬</div>

        <h1>LiveChat</h1>

        <p>
          Join the community and
          <br />
          start chatting today.
        </p>

        <div className="feature">
          <p>✅ Real-time Chat</p>
          <p>🔒 Secure JWT Login</p>
          <p>🖼 Image Sharing</p>
          <p>⚡ Fast & Reliable</p>
        </div>
      </div>

      {/* 右側 */}
      <div className="login-right">
        <div className="login-card">
          <h2>Create Account ✨</h2>

          <p className="subtitle">Create your LiveChat account</p>

          <form onSubmit={handleRegister}>
            <label>Username</label>

            <input
              type="text"
              placeholder="Mike"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Email</label>

            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Register</button>
          </form>

          <div className="register-link">
            Already have an account?
            <Link to="/">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
