import axiosInstance from "./axios";

const commentService = {
  // Add a comment to a task
  addComment: async (commentData) => {
    const response = await axiosInstance.post("/comments", commentData);
    return response.data;
  },

  // Get all comments for a specific task
  getCommentsByTask: async (taskId, params = {}) => {
    const response = await axiosInstance.get(
      `/comments/task/${taskId}`,
      { params }
    );
    return response.data;
  },

  // Get a single comment
  getCommentById: async (id) => {
    const response = await axiosInstance.get(`/comments/${id}`);
    return response.data;
  },

  // Get current user's comments
  getMyComments: async (params = {}) => {
    const response = await axiosInstance.get(
      "/comments/my-comments",
      { params }
    );
    return response.data;
  },
};

export default commentService;