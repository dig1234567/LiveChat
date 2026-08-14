import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // 還在檢查登入狀態
  if (loading) {
    return <h2>Loading...</h2>;
  }

  // 沒登入，導回登入頁
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 已登入，顯示真正的頁面
  return children;
};

export default ProtectedRoute;
