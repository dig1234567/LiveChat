import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const JoinRoom = ({ room, setRoom, joinRoom }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 50,
      }}
    >
      <div
        style={{
          width: 450,
          background: "#fff",
          padding: 40,
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              fontSize: 60,
              marginBottom: 10,
            }}
          >
            💬
          </div>

          <h1
            style={{
              margin: 0,
              color: "#2e7d32",
            }}
          >
            即時聊天室
          </h1>

          <p
            style={{
              color: "#666",
              marginTop: 10,
            }}
          >
            與朋友一起聊天吧
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 15,
          }}
        >
          <input
            placeholder="🏠 輸入房間名稱"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            style={{
              padding: 15,
              borderRadius: 12,
              border: "1px solid #ddd",
              fontSize: 16,
              outline: "none",
            }}
          />

          <button
            onClick={joinRoom}
            style={{
              padding: 15,
              border: "none",
              borderRadius: 12,
              background: "#4caf50",
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: 10,
            }}
          >
            🚀 加入房間
          </button>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 15,
              background: "transparent",
              border: "none",
              color: "#666",
              cursor: "pointer",
              fontSize: 15,
            }}
          >
            🚪 登出
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
