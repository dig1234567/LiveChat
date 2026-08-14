import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import authService from "../service/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 目前登入者
  const [currentUser, setCurrentUser] = useState(null);

  const logout = () => {
    localStorage.removeItem("token"); // 移除使用者c
    setCurrentUser(null);
  };

  // 是否還在檢查登入狀態
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // 1. 看 localStorage 有沒有 token
        const token = localStorage.getItem("token");

        // 2. 沒 token 就代表沒登入
        if (!token) {
          setLoading(false);
          return;
        }

        // 3. 去後端取得使用者資料
        const user = await authService.getProfile();
        console.log("AuthContext user:", user);
        // 4. 存進 Context
        setCurrentUser(user);
      } catch (err) {
        console.log(err);

        // token 已失效
        localStorage.removeItem("token");
      } finally {
        // 不管成功或失敗，都結束 loading
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
