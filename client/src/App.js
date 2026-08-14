import { BrowserRouter, Routes, Route } from "react-router-dom";
import MaintenancePage from "./component/MaintenancePage";
import ChatApp from "./pages/ChatApp";
import Login from "./pages/login";
import Register from "./pages/register";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  const maintenance = false;

  if (maintenance) {
    return <MaintenancePage />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
