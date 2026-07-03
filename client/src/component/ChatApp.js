import { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "./socket";
import JoinRoom from "./component/JoinRoom";
import MessageInput from "./component/MessageInput";
import MessageBubble from "./component/Message.Bubble";
import "./App.css";

function ChatApp() {
  const [room, setRoom] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  // 🔥 聊天訊息
  const [messages, setMessages] = useState([]);
  // 🔥 房間成員
  const [roomUsers, setRoomUsers] = useState([]);
  // typing
  const [typingUser, setTypingUser] = useState("");

  // 自動捲到底
  const bottomRef = useRef(null);

  useEffect(() => {
    // 即時訊息
    socket.on("receive-message", (data) => {
      console.log("收到訊息", data);
      if (!data) return;
      setMessages((prev) => [...prev, data]);

      // 不是自己發的才算已讀
      if (data.user !== username)
        socket.emit("message-read", {
          messageId: data._id,
          socketId: socket.id,
        });
    });

    // 歡迎訊息
    socket.on("welcome", (msg) => {
      console.log(msg);
    });

    // 在線人數
    socket.on("online-users", (count) => {
      setOnlineUsers(count);
    });

    // 歷史訊息
    socket.on("previous-messages", (data) => {
      setMessages(data);
    });

    // typing
    socket.on("typing", (user) => {
      setTypingUser(user);

      setTimeout(() => {
        setTypingUser("");
      }, 2000);
    });
    // 🔥 房間在線名單
    socket.on("room-users", (users) => {
      setRoomUsers(users);
    });

    // 🔥 已讀更新
    socket.on("message-read", ({ messageId, readBy }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                readBy,
              }
            : msg,
        ),
      );
    });

    socket.on("message-deleted", (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    socket.on("message-edited", (updatedMessage) => {
      console.log("收到編輯", updatedMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg,
        ),
      );
    });

    return () => {
      socket.off("receive-message");
      socket.off("welcome");
      socket.off("online-users");
      socket.off("previous-messages");
      socket.off("typing");

      socket.off("room-users");
      socket.off("message-read");
      socket.off("message-deleted");
    };
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ 連線成功:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ 斷線:", reason);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // 自動滑到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // 加入房間
  const joinRoom = () => {
    if (!room.trim() || !username.trim()) return;

    socket.emit("join-room", {
      room,
      user: username,
    });

    setJoined(true);
  };

  const leaveRoom = () => {
    if (!window.confirm("確定離開聊天室?")) {
      return;
    }
    socket.emit("leave-room", {
      room,
      user: username,
    });

    setJoined(false);
    setMessage([]);
    setRoomUsers([]);
  };

  // 傳送訊息
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send-message", {
      room,
      user: username,
      text: message,
      replyTo: replyMessage,
    });

    setMessage("");
    setReplyMessage(null);
  };

  const sendImage = (file) => {
    if (!file) return;
    console.log("選到圖片", file);
    setSelectedImage(file);
  };

  const uploadImage = async () => {
    if (!selectedImage) return;
    const formData = new FormData();
    formData.append("image", selectedImage);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload`,
        formData,
      );
      socket.emit("send-image", {
        room,
        user: username,
        imageUrl: res.data.imageUrl,
      });
      console.log("圖片已送出");
      setSelectedImage(null);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteMessage = (messageId) => {
    const confirmDelete = window.confirm("確定要刪除這筆訊息嗎?");

    if (!confirmDelete) {
      return;
    }
    socket.emit("delete-message", messageId);
  };

  const editMessage = (messageId, oldText) => {
    const newText = prompt("修改訊息", oldText);

    if (!newText) {
      return;
    }
    socket.emit("edit-message", {
      messageId,
      text: newText,
    });
  };

  return (
    <div className="app-container">
      {joined && (
        <>
          <h1>💬 即時聊天室</h1>
          <h3>目前在線：{onlineUsers} 人</h3>
        </>
      )}
      {!joined ? (
        <JoinRoom
          username={username}
          setUsername={setUsername}
          room={room}
          setRoom={setRoom}
          joinRoom={joinRoom}
        />
      ) : (
        <>
          <div className="room-header">
            <div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#2e7d32",
                }}
              >
                # {room}
              </div>

              <div
                style={{
                  color: "#666",
                  marginTop: 4,
                }}
              >
                🟢 在線 {onlineUsers} 人
              </div>
            </div>

            <button
              onClick={leaveRoom}
              style={{
                background: "#f44336",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              🚪 離開聊天室
            </button>
          </div>

          <div className="chat-layout">
            {/* Sidebar */}
            <div className="sidebar">
              <h4 className="sidebar-title">在線成員 ({roomUsers.length})</h4>

              {roomUsers.map((userObj) => (
                <div
                  key={userObj.socketId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* 在線綠點 */}
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#00c853",
                      flexShrink: 0,
                    }}
                  />

                  <div className="avatar">
                    {userObj.user?.[0]?.toUpperCase()}
                  </div>

                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >
                    {userObj.user}
                  </div>
                </div>
              ))}
            </div>

            {/* 聊天區 */}
            <div className="chat-content">
              <div className="chat-box">
                {messages.map((m, i) => (
                  <MessageBubble
                    key={i}
                    message={m}
                    username={username}
                    deleteMessage={deleteMessage}
                    editMessage={editMessage}
                    setPreviewImage={setPreviewImage}
                    setReplyMessage={setReplyMessage}
                  />
                ))}

                <p
                  style={{
                    color: "#666",
                    fontSize: 14,
                    marginTop: 10,
                  }}
                >
                  {typingUser && `${typingUser} 正在輸入...`}
                </p>

                <div ref={bottomRef}></div>
              </div>

              {selectedImage && (
                <div
                  style={{
                    marginBottom: 10,
                    padding: 10,
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    backgroundColor: "#fff",
                  }}
                >
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="預覽圖片"
                    style={{
                      maxWidth: 200,
                      borderRadius: 10,
                    }}
                  />

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <button onClick={uploadImage}>傳送圖片</button>

                    <button onClick={() => setSelectedImage(null)}>取消</button>
                  </div>
                </div>
              )}

              {replyMessage && (
                <div
                  style={{
                    padding: 12,
                    background: "#f8f9fb",
                    borderLeft: "4px solid #4f8cff",
                    borderRadius: 10,
                    marginBottom: 10,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#4f8cff",
                      marginBottom: 4,
                    }}
                  >
                    ↩ 回覆 {replyMessage.user}
                  </div>
                  <div
                    style={{
                      color: "#666",
                      fontSize: 14,
                    }}
                  >
                    {replyMessage.text || "📷 圖片"}
                  </div>

                  <div>{replyMessage.text}</div>

                  <button
                    onClick={() => setReplyMessage(null)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: 10,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#888",
                      fontSize: 16,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <MessageInput
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
                sendImage={sendImage}
                room={room}
                username={username}
                socket={socket}
              />
            </div>
          </div>
        </>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={previewImage}
            alt="預覽圖片"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 10,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ChatApp;
