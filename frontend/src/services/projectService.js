import axiosInstance from "./axios";

const projectService = {
  // Get all projects (filtered by role automatically on backend)
  getAllProjects: async (params = {}) => {
    const response = await axiosInstance.get("/projects", { params });
    return response.data;
  },

  // Get single project by ID
  getProjectById: async (id) => {
    const response = await axiosInstance.get(`/projects/${id}`);
    return response.data;
  },

  // Create a new project
  createProject: async (projectData) => {
    const response = await axiosInstance.post("/projects", projectData);
    return response.data;
  },

  // Update an existing project
  updateProject: async (id, projectData) => {
    const response = await axiosInstance.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete a project
  deleteProject: async (id) => {
    const response = await axiosInstance.delete(`/projects/${id}`);
    return response.data;
  },

  // Get all members of a project
  getProjectMembers: async (id) => {
    const response = await axiosInstance.get(`/projects/${id}/members`);
    return response.data;
  },

  // Add a member to a project
  addMember: async (id, memberData) => {
    const response = await axiosInstance.post(
      `/projects/${id}/members`,
      memberData
    );
    return response.data;
  },

  // Remove a member from a project
  removeMember: async (projectId, userId) => {
    const response = await axiosInstance.delete(
      `/projects/${projectId}/members/${userId}`
    );
    return response.data;
  },
};

export default projectService;