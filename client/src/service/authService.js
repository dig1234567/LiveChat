import axios from "axios";

const API_URL = "http://localhost:8080/api/user";

class AuthService {
  async register(userData) {
    const res = await axios.post(`${API_URL}/register`, userData);
    return res.data;
  }
  async login(email, password) {
    const res = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    return res.data;
  }
  async getProfile() {
    const token = localStorage.getItem("token");

    console.log("Token:", token);

    const res = await axios.get(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Profile API:", res.data);

    return res.data;
  }
}

export default new AuthService();
