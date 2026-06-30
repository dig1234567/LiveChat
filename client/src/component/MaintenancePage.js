import "./MaintenancePage.css";

function MaintenancePage() {
  return (
    <div className="maintenance">
      <div className="card">
        <h1>💬 LiveChat</h1>

        <h2>🚧 System Maintenance</h2>

        <p>
          我們正在升級 <strong>LiveChat 2.0</strong>
          <br />
          暫時無法使用聊天室。
        </p>

        <div className="feature-list">
          <h3>✨ 即將推出</h3>

          <p>✅ 使用者登入 / 註冊</p>
          <p>✅ 個人頭像</p>
          <p>✅ 推播通知</p>
          <p>✅ 深色模式</p>
          <p>✅ 訊息搜尋</p>
          <p>✅ 正在輸入...</p>
        </div>

        <p className="version">
          Version 2.0
          <br />
          Thank you for your patience ❤️
        </p>

        <button onClick={() => window.location.reload()}>重新整理</button>
      </div>
    </div>
  );
}

export default MaintenancePage;
