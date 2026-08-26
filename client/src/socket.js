import { io } from "socket.io-client";

console.log("API URL:", process.env.REACT_APP_API_URL);

const socket = io(process.env.REACT_APP_API_URL, {
  auth: {
    token: localStorage.getItem("token"),
  },
});

socket.on("connect", () => {
  console.log("Socket Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("Socket Error:", err);
});

export default socket;
