import React, { useState } from "react";
import "./auth.css";
import authService from "../service/authService";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";
import { FiLoader } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState("");
  const [loading, setLoading] = useState("");

  const { setCurrentUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const data = await authService.login(email, password);

      localStorage.setItem("token", data.token);

      setCurrentUser(data.user);

      toast.success("登入成功");

      navigate("/chat");
    } catch (err) {
      console.log(err);
      toast.error("登入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 左側 */}
      <div className="login-left">
        <div className="logo">💬</div>

        <h1>LiveChat</h1>

        <p>
          Connect with your friends
          <br />
          anytime, anywhere.
        </p>

        <div className="feature">
          <p>✅ Real-time Chat</p>
          <p>🔒 JWT Authentication</p>
          <p>🖼 Image Sharing</p>
          <p>⚡ Fast & Secure</p>
        </div>
      </div>

      {/* 右側 */}
      <div className="login-right">
        <div className="login-card">
          <h2>Welcome Back 👋</h2>

          <p className="subtitle">Login to continue chatting</p>

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <FiLoader className="spinner" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="register-link">
            Don't have an account?
            <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
