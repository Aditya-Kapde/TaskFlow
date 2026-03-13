import axiosInstance from "./axios";

const userService = {
  // Get all users with optional filters
  getAllUsers: async (params = {}) => {
    const response = await axiosInstance.get("/users", { params });
    return response.data;
  },

  // Get single user by ID
  getUserById: async (id) => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
  },

  // Update user name or email
  updateUser: async (id, data) => {
    const response = await axiosInstance.patch(`/users/${id}`, data);
    return response.data;
  },

  // Update user role
  updateUserRole: async (id, role) => {
    const response = await axiosInstance.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  // Deactivate a user account
  deactivateUser: async (id) => {
    const response = await axiosInstance.patch(`/users/${id}/deactivate`);
    return response.data;
  },

  // Reactivate a user account
  activateUser: async (id) => {
    const response = await axiosInstance.patch(`/users/${id}/activate`);
    return response.data;
  },
};

export default userService;