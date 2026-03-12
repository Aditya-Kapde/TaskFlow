const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────
// @desc    Create a new project
// @route   POST /api/projects
// @access  ADMIN, PROJECT_MANAGER
// ─────────────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const { title, description, deadline, status } = req.body;

    const project = await Project.create({
      title,
      description,
      deadline,
      status,
      createdBy: req.user.id,
      // Automatically add the creator as a PROJECT_MANAGER member
      // So the creator can immediately manage their own project
      members: [
        {
          user: req.user.id,
          role: "PROJECT_MANAGER",
        },
      ],
    });

    // Populate createdBy so response includes name and email
    // instead of just the raw MongoDB ObjectId
    await project.populate("createdBy", "name email role");

    return ApiResponse.success(res, 201, "Project created successfully", {
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all projects
// @route   GET /api/projects
// @access  ADMIN sees all | Others see only their projects
// ─────────────────────────────────────────────────────────────
const getAllProjects = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = {};

    // ── Role-based data filtering ──────────────────────────────
    // ADMIN sees every project in the system
    // Everyone else only sees projects they are members of
    if (req.user.role !== "ADMIN") {
      filter["members.user"] = req.user.id;
    }

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("createdBy", "name email")        // Only name and email
        .populate("members.user", "name email role") // Populate each member
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Project.countDocuments(filter),
    ]);

    return ApiResponse.success(res, 200, "Projects fetched successfully", {
      projects,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  ADMIN | Project members only
// ─────────────────────────────────────────────────────────────
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("members.user", "name email role");

    if (!project) {
      return ApiResponse.error(res, 404, "Project not found");
    }

    // ── Check access ───────────────────────────────────────────
    // ADMIN can view any project
    // Others must be a member of this specific project
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user.id.toString()
    );

    if (req.user.role !== "ADMIN" && !isMember) {
      return ApiResponse.error(
        res,
        403,
        "Access denied. You are not a member of this project"
      );
    }

    return ApiResponse.success(res, 200, "Project fetched successfully", {
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update project details
// @route   PUT /api/projects/:id
// @access  ADMIN | PROJECT_MANAGER (must be project member)
// ─────────────────────────────────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    const { title, description, deadline, status } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return ApiResponse.error(res, 404, "Project not found");
    }

    // ── Check if user has permission to update this project ─────
    // ADMIN can update any project
    // PROJECT_MANAGER can only update projects they are a member of
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user.id.toString()
    );

    if (req.user.role !== "ADMIN" && !isMember) {
      return ApiResponse.error(
        res,
        403,
        "Access denied. You are not a member of this project"
      );
    }

    // ── Apply updates only for fields that were provided ────────
    // Using if checks instead of Object.assign prevents
    // accidentally clearing a field by not including it
    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (deadline) project.deadline = deadline;
    if (status) project.status = status;

    await project.save();
    await project.populate("createdBy", "name email");
    await project.populate("members.user", "name email role");

    return ApiResponse.success(res, 200, "Project updated successfully", {
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  ADMIN only
// ─────────────────────────────────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return ApiResponse.error(res, 404, "Project not found");
    }

    // ── Cascading delete ───────────────────────────────────────
    // Step 1: Find all tasks belonging to this project
    const tasks = await Task.find({ projectId: project._id });
    const taskIds = tasks.map((t) => t._id);

    // Step 2: Delete all comments on those tasks
    if (taskIds.length > 0) {
      await Comment.deleteMany({ taskId: { $in: taskIds } });
    }

    // Step 3: Delete all tasks in the project
    await Task.deleteMany({ projectId: project._id });

    // Step 4: Delete the project itself
    await Project.findByIdAndDelete(req.params.id);

    return ApiResponse.success(
      res,
      200,
      "Project and all associated tasks and comments deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Add a member to project
// @route   POST /api/projects/:id/members
// @access  ADMIN | PROJECT_MANAGER (must be project member)
// ─────────────────────────────────────────────────────────────
const addMember = async (req, res, next) => {
  try {
    const { userId, role = "DEVELOPER" } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return ApiResponse.error(res, 404, "Project not found");
    }

    // ── Permission check ───────────────────────────────────────
    const isProjectMember = project.members.some(
      (m) => m.user.toString() === req.user.id.toString()
    );

    if (req.user.role !== "ADMIN" && !isProjectMember) {
      return ApiResponse.error(
        res,
        403,
        "Access denied. You are not a member of this project"
      );
    }

    // ── Check the user being added actually exists ─────────────
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return ApiResponse.error(res, 404, "User to add not found");
    }

    if (!userToAdd.isActive) {
      return ApiResponse.error(res, 400, "Cannot add a deactivated user");
    }

    // ── Prevent duplicate members ──────────────────────────────
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userId
    );

    if (alreadyMember) {
      return ApiResponse.error(res, 409, "User is already a member of this project");
    }

    // ── Add member ─────────────────────────────────────────────
    project.members.push({ user: userId, role });
    await project.save();
    await project.populate("members.user", "name email role");

    return ApiResponse.success(res, 200, "Member added successfully", {
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Remove a member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  ADMIN | PROJECT_MANAGER (must be project member)
// ─────────────────────────────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return ApiResponse.error(res, 404, "Project not found");
    }

    // ── Permission check ───────────────────────────────────────
    const isProjectMember = project.members.some(
      (m) => m.user.toString() === req.user.id.toString()
    );

    if (req.user.role !== "ADMIN" && !isProjectMember) {
      return ApiResponse.error(
        res,
        403,
        "Access denied. You are not a member of this project"
      );
    }

    // ── Prevent removing the project creator ───────────────────
    // The creator must always remain a member
    // Otherwise the project becomes ownerless
    if (project.createdBy.toString() === userId) {
      return ApiResponse.error(
        res,
        400,
        "Cannot remove the project creator from the project"
      );
    }

    // ── Check user is actually a member ────────────────────────
    const memberExists = project.members.some(
      (m) => m.user.toString() === userId
    );

    if (!memberExists) {
      return ApiResponse.error(res, 404, "User is not a member of this project");
    }

    // ── Remove member ──────────────────────────────────────────
    project.members = project.members.filter(
      (m) => m.user.toString() !== userId
    );

    await project.save();
    await project.populate("members.user", "name email role");

    return ApiResponse.success(res, 200, "Member removed successfully", {
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all members of a project
// @route   GET /api/projects/:id/members
// @access  ADMIN | Project members only
// ─────────────────────────────────────────────────────────────
const getProjectMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "members.user",
      "name email role isActive"
    );

    if (!project) {
      return ApiResponse.error(res, 404, "Project not found");
    }

    // ── Access check ───────────────────────────────────────────
    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user.id.toString()
    );

    if (req.user.role !== "ADMIN" && !isMember) {
      return ApiResponse.error(
        res,
        403,
        "Access denied. You are not a member of this project"
      );
    }

    return ApiResponse.success(res, 200, "Members fetched successfully", {
      members: project.members,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectMembers,
};