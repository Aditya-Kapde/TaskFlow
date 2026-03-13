import axiosInstance from "./axios";

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  },

  // Login — stores token and user in localStorage on success
  login: async (credentials) => {
    const response = await axiosInstance.post("/auth/login", credentials);
    const { accessToken, user } = response.data.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    return response.data;
  },

  // Logout — clears localStorage and calls backend
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } finally {
      // Always clear local storage even if backend call fails
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  },

  // Get current logged-in user profile
  getMe: async () => {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  },

  // Refresh access token manually (used on app startup)
  refreshToken: async () => {
    const response = await axiosInstance.post("/auth/refresh");
    return response.data;
  },
};

export default authService;