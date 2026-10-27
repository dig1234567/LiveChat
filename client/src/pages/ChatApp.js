import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "../socket";
import JoinRoom from "../component/JoinRoom";
import MessageInput from "../component/MessageInput";
import MessageBubble from "../component/Message.Bubble";
import "../App.css";
import { Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

function ChatApp() {
  const { currentUser } = useAuth();
  const [room, setRoom] = useState(
    () => localStorage.getItem("chatRoom") || "",
  );

  const [joined, setJoined] = useState(
    () => !!localStorage.getItem("chatRoom"),
  );
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  // 🔥 聊天訊息
  const [messages, setMessages] = useState([]);
  // 🔥 房間成員
  const [roomUsers, setRoomUsers] = useState([]);
  // 🔥 私訊狀態
  const [privateMessages, setPrivateMessages] = useState([]);
  // typing
  const [typingUser, setTypingUser] = useState("");
  const [privateUser, setPrivateUser] = useState(null);

  // 自動捲到底
  const bottomRef = useRef(null);

  useEffect(() => {
    // 即時訊息
    socket.on("receive-message", (data) => {
      if (!data) return;

      setMessages((prev) => [...prev, data]);

      // currentUser 還沒載入就不要做已讀
      if (!currentUser) return;

      if (data.user !== currentUser.username) {
        socket.emit("message-read", {
          messageId: data._id,
          socketId: socket.id,
        });
      }
    });

    // 私訊對話顯示
    socket.on("receive-private-message", (data) => {
      setPrivateMessages((prev) => [...prev, data]);
      const sender = roomUsers.find((user) => user.userId === data.sender);

      if (sender) {
        setPrivateUser(sender);
      }
    });

    // 載入私訊訊息
    socket.on("private-messages", (messages) => {
      setPrivateMessages(messages);
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

  useEffect(() => {
    if (!joined) return;

    const joinSocketRoom = () => {
      console.log("準備加入聊天室:", {
        username: socket.auth?.token ? "有 Token" : "沒有 Token",
        socketId: socket.id,
        connected: socket.connected,
        room,
        joined,
      });
      socket.emit("join-room", {
        room,
      });
    };

    if (socket.connected) {
      joinSocketRoom();
    } else {
      socket.connect();
    }

    socket.on("connect", joinSocketRoom);

    return () => {
      socket.off("connect", joinSocketRoom);
    };
  }, [joined, room]);

  // 自動滑到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // 加入房間
  const joinRoom = () => {
    if (!room.trim()) return;

    localStorage.setItem("chatRoom", room);

    setJoined(true);
  };

  const leaveRoom = async () => {
    const result = await Swal.fire({
      title: "確定要離開聊天室嗎？",
      text: `離開「${room}」後將不再收到訊息。`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "確定離開",
      cancelButtonText: "取消",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    socket.emit("leave-room", {
      room,
    });

    setJoined(false);
    setMessage([]);
    setRoomUsers([]);
    localStorage.removeItem("chatRoom");
  };

  // 傳送訊息
  const sendMessage = () => {
    if (!message.trim()) return;

    if (privateUser) {
      socket.emit("send-private-message", {
        receiverId: privateUser.userId,
        text: message,
      });
      setMessage("");
      return;
    }
    socket.emit("send-message", {
      room,
      text: message,
      replyTo: replyMessage,
      avatar: currentUser.avatar,
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
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      // 聊天室圖片
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload`,
        formData,
      );
      // 私訊聊天室圖片
      if (privateUser) {
        socket.emit("send-private-message", {
          receiverId: privateUser.userId,
          imageUrl: res.data.imageUrl,
        });
      } else {
        // 公開聊天室圖片
        socket.emit("send-image", {
          room,
          imageUrl: res.data.imageUrl,
        });
        console.log("圖片已送出");
      }
      setSelectedImage(null);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteMessage = async (messageId) => {
    const result = await Swal.fire({
      title: "確定刪除？",
      text: "刪除後無法復原。",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }
    socket.emit("delete-message", messageId);
    toast.success("已刪除");
  };

  const editMessage = async (messageId, oldText) => {
    const result = await Swal.fire({
      title: "修改訊息",
      input: "text",
      inputValue: oldText,
      showCancelButton: true,
      confirmButtonText: "儲存",
      cancelButtonText: "取消",
    });

    if (!result.isConfirmed) {
      return;
    }
    socket.emit("edit-message", {
      messageId,
      text: result.value,
    });
    toast.success("修改成功");
  };

  return (
    <div className="app-container">
      {joined && (
        <div className="chat-header">
          <h1>💬 即時聊天室</h1>

          <div className="header-status">
            <span className="online-dot"></span>
            <span>{onlineUsers} 人在線</span>
          </div>
        </div>
      )}
      {!joined ? (
        <JoinRoom room={room} setRoom={setRoom} joinRoom={joinRoom} />
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

              {/*私訊邏輯*/}
              {roomUsers.map((userObj) => (
                <div
                  key={userObj.socketId}
                  onClick={async () => {
                    if (String(userObj.userId) === String(currentUser._id)) {
                      Swal.fire({
                        title: "無法私訊自己",
                        text: "請選擇其他使用者",
                        icon: "info",
                        confirmButtonText: "知道了",
                      });
                      return;
                    }
                    const result = await Swal.fire({
                      title: `要私訊 ${userObj.user} 嗎？`,
                      text: "即將開啟與此使用者的私訊",
                      icon: "question",
                      showCancelButton: true,
                      confirmButtonText: "開始私訊",
                      cancelButtonText: "取消",
                      confirmButtonColor: "#3085d6",
                    });

                    if (!result.isConfirmed) return;

                    console.log("點到的使用者", userObj);

                    setPrivateUser(userObj);

                    socket.emit("get-private-messages", {
                      receiverId: userObj.userId,
                    });
                  }}
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
                    {userObj.avatar ? (
                      <img src={userObj.avatar} alt={`${userObj.user} 頭像`} />
                    ) : (
                      userObj.user?.[0]?.toUpperCase()
                    )}
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
              {/*開啟私訊頁面*/}
              {privateUser && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div className="avatar">
                      {privateUser.avatar ? (
                        <img
                          src={privateUser.avatar}
                          alt={`${privateUser.user} 頭像`}
                        />
                      ) : (
                        privateUser.user?.[0]?.toUpperCase()
                      )}
                    </div>

                    <strong>{privateUser.user}</strong>
                  </div>

                  <button
                    onClick={() => {
                      setPrivateUser(null);
                      setPrivateMessages([]);
                    }}
                  >
                    返回公開聊天室
                  </button>
                </div>
              )}
              {/*顯示聊天紀錄以及判斷是否要私訊*/}
              <div className="chat-box">
                {!privateUser && (
                  <>
                    {messages.map((m, i) => (
                      <MessageBubble
                        key={i}
                        message={m}
                        username={currentUser.username}
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
                  </>
                )}

                {privateUser &&
                  privateMessages
                    .filter((m) => {
                      const senderId = String(m.sender?._id || m.sender);
                      const receiverId = String(m.receiver?._id || m.receiver);

                      const myId = String(currentUser._id);
                      const partnerId = String(privateUser.userId);

                      return (
                        (senderId === myId && receiverId === partnerId) ||
                        (senderId === partnerId && receiverId === myId)
                      );
                    })

                    .map((m, i) => {
                      const senderId = String(m.sender?._id || m.sender);
                      const myId = String(currentUser._id);
                      const isMine = senderId === myId;

                      return (
                        <div
                          key={m._id || i}
                          style={{
                            display: "flex",
                            justifyContent: isMine ? "flex-end" : "flex-start",
                            alignItems: "flex-end",
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          {!isMine && (
                            <div className="avatar">
                              {privateUser.avatar ? (
                                <img
                                  src={privateUser.avatar}
                                  alt={`${privateUser.user} 頭像`}
                                />
                              ) : (
                                privateUser.user?.[0]?.toUpperCase()
                              )}
                            </div>
                          )}

                          {/*私訊顯示時間和文字*/}
                          <div
                            style={{
                              maxWidth: "70%",
                              padding: "10px 14px",
                              borderRadius: 16,
                              background: isMine ? "#d9fdd3" : "#ffffff",
                              color: "#222222",
                              overflowWrap: "anywhere",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                            }}
                          >
                            {m.imageUrl && (
                              <div
                                style={{
                                  marginBottom: 10,
                                  padding: 5,
                                  borderRadius: 10,
                                }}
                              >
                                <img
                                  src={m.imageUrl}
                                  alt="私訊圖片"
                                  onClick={() => setPreviewImage(m.imageUrl)}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: 300,
                                    borderRadius: 10,
                                    cursor: "pointer",
                                  }}
                                />
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: 15,
                                lineHeight: 1.5,
                                color: "#222222",
                              }}
                            >
                              {m.text}
                            </div>

                            {m.time && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#555555",
                                  textAlign: "right",
                                  marginTop: 6,
                                  fontWeight: 500,
                                }}
                              >
                                {m.time}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

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
                username={currentUser.username}
                socket={socket}
                privateUser={privateUser}
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
