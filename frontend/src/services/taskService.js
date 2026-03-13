import axiosInstance from "./axios";

const taskService = {
  // Get all tasks with optional filters
  getAllTasks: async (params = {}) => {
    const response = await axiosInstance.get("/tasks", { params });
    return response.data;
  },

  // Get tasks for a specific project
  getTasksByProject: async (projectId, params = {}) => {
    const response = await axiosInstance.get(
      `/tasks/project/${projectId}`,
      { params }
    );
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await axiosInstance.get("/tasks/dashboard");
    return response.data;
  },

  // Get single task by ID
  getTaskById: async (id) => {
    const response = await axiosInstance.get(`/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  createTask: async (taskData) => {
    const response = await axiosInstance.post("/tasks", taskData);
    return response.data;
  },

  // Full task update
  updateTask: async (id, taskData) => {
    const response = await axiosInstance.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Status-only update (for DEVELOPERs)
  updateTaskStatus: async (id, status) => {
    const response = await axiosInstance.patch(
      `/tasks/${id}/status`,
      { status }
    );
    return response.data;
  },

  // Delete a task
  deleteTask: async (id) => {
    const response = await axiosInstance.delete(`/tasks/${id}`);
    return response.data;
  },
};

export default taskService;