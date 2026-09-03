import React, { useState } from "react";
import EmojiPicker from "emoji-picker-react";

const MessageInput = ({
  message,
  setMessage,
  sendMessage,
  sendImage,
  room,
  username,
  socket,
}) => {
  const [showEmoji, setShowEmoji] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      console.log("選到圖片");
      sendImage(file);
    }

    // 讓同一張圖片可以再次選取
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "10px 12px",
        boxSizing: "border-box",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Emoji Picker */}
      {showEmoji && (
        <div
          style={{
            position: "absolute",
            bottom: "72px",
            left: "8px",
            zIndex: 999,
          }}
        >
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setMessage((prev) => prev + emojiData.emoji);
              setShowEmoji(false);
            }}
            width={320}
            height={400}
          />
        </div>
      )}

      {/* 圖片按鈕 */}
      <label
        title="傳送圖片"
        style={{
          width: "44px",
          height: "44px",
          minWidth: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#f3f4f6",
          color: "#4b5563",
          cursor: "pointer",
          fontSize: "21px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#e5e7eb";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#f3f4f6";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        📷

        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleImageChange}
        />
      </label>

      {/* Emoji 按鈕 */}
      <button
        type="button"
        title="表情符號"
        onClick={() => setShowEmoji((prev) => !prev)}
        style={{
          width: "44px",
          height: "44px",
          minWidth: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: "50%",
          background: showEmoji ? "#e8f2ff" : "#f3f4f6",
          color: "#4b5563",
          cursor: "pointer",
          fontSize: "21px",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#e5e7eb";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = showEmoji
            ? "#e8f2ff"
            : "#f3f4f6";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        😊
      </button>

      {/* 輸入框 */}
      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);

          socket.emit("typing", {
            room,
            user: username,
          });
        }}
        onKeyDown={handleKeyDown}
        placeholder="輸入訊息..."
        style={{
          flex: 1,
          minWidth: 0,
          height: "44px",
          padding: "0 14px",
          boxSizing: "border-box",
          border: "none",
          outline: "none",
          background: "#f8fafc",
          borderRadius: "12px",
          fontSize: "16px",
          color: "#1f2937",
        }}
      />

      {/* 送出按鈕 */}
      <button
        type="button"
        onClick={sendMessage}
        style={{
          height: "44px",
          padding: "0 22px",
          border: "none",
          borderRadius: "12px",
          background: "#2196f3",
          color: "#ffffff",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#1976d2";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#2196f3";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        送出
      </button>
    </div>
  );
};

export default MessageInput;
