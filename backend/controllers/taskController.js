const Task = require("../models/Task");
const Project = require("../models/Project");
const Comment = require("../models/Comment");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────
// Helper — verify user is a member of the project
// Returns the project if found, null if not
// Reused across multiple controller functions
// ─────────────────────────────────────────────────────────────
const getProjectIfMember = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { project: null, error: "Project not found" };

  // ADMIN bypasses membership check
  if (userRole === "ADMIN") return { project, error: null };

  const isMember = project.members.some(
    (m) => m.user.toString() === userId.toString()
  );

  if (!isMember) {
    return {
      project: null,
      error: "Access denied. You are not a member of this project",
    };
  }

  return { project, error: null };
};

// ─────────────────────────────────────────────────────────────
// @desc    Create a new task
// @route   POST /api/tasks
// @access  ADMIN | PROJECT_MANAGER (must be project member)
// ─────────────────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      projectId,
      assignedTo,
      priority,
      status,
      deadline,
    } = req.body;

    // ── Verify user is a member of the target project ──────────
    const { project, error } = await getProjectIfMember(
      projectId,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(
        res,
        error === "Project not found" ? 404 : 403,
        error
      );
    }

    // ── If assigning to someone, verify they are project member ─
    // Prevents assigning tasks to people outside the project
    if (assignedTo) {
      const assigneeIsMember = project.members.some(
        (m) => m.user.toString() === assignedTo
      );

      if (!assigneeIsMember) {
        return ApiResponse.error(
          res,
          400,
          "Assigned user is not a member of this project"
        );
      }

      // Verify the assigned user actually exists and is active
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser || !assignedUser.isActive) {
        return ApiResponse.error(
          res,
          400,
          "Assigned user does not exist or is deactivated"
        );
      }
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user.id,
      priority: priority || "MEDIUM",
      status: status || "TODO",
      deadline: deadline || null,
    });

    // Populate references so response is human readable
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("projectId", "title");

    return ApiResponse.success(res, 201, "Task created successfully", {
      task,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all tasks (with filters)
// @route   GET /api/tasks
// @access  All authenticated users (filtered by membership)
// ─────────────────────────────────────────────────────────────
const getAllTasks = async (req, res, next) => {
  try {
    const {
      projectId,
      status,
      priority,
      assignedTo,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // ── Role-based task visibility ─────────────────────────────
    if (req.user.role === "ADMIN") {
      // ADMIN sees all tasks across all projects
      if (projectId) filter.projectId = projectId;
    } else if (req.user.role === "DEVELOPER") {
      // DEVELOPER only sees tasks assigned to them
      // OR tasks in projects they are members of
      const memberProjects = await Project.find({
        "members.user": req.user.id,
      }).select("_id");

      const projectIds = memberProjects.map((p) => p._id);
      filter.projectId = { $in: projectIds };

      // Further filter by specific project if requested
      if (projectId) filter.projectId = projectId;
    } else {
      // PROJECT_MANAGER sees all tasks in their projects
      const memberProjects = await Project.find({
        "members.user": req.user.id,
      }).select("_id");

      const projectIds = memberProjects.map((p) => p._id);
      filter.projectId = { $in: projectIds };

      if (projectId) filter.projectId = projectId;
    }

    // ── Optional filters ───────────────────────────────────────
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("projectId", "title status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(filter),
    ]);

    return ApiResponse.success(res, 200, "Tasks fetched successfully", {
      tasks,
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
// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Project members only
// ─────────────────────────────────────────────────────────────
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .populate("projectId", "title status");

    if (!task) {
      return ApiResponse.error(res, 404, "Task not found");
    }

    // ── Verify user has access to the project this task belongs to
    const { error } = await getProjectIfMember(
      task.projectId._id,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(
        res,
        error === "Project not found" ? 404 : 403,
        error
      );
    }

    return ApiResponse.success(res, 200, "Task fetched successfully", {
      task,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all tasks for a specific project
// @route   GET /api/tasks/project/:projectId
// @access  Project members only
// ─────────────────────────────────────────────────────────────
const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo, page = 1, limit = 10 } = req.query;

    // ── Verify project access ──────────────────────────────────
    const { error } = await getProjectIfMember(
      projectId,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(
        res,
        error === "Project not found" ? 404 : 403,
        error
      );
    }

    const filter = { projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(filter),
    ]);

    return ApiResponse.success(res, 200, "Tasks fetched successfully", {
      tasks,
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
// @desc    Full task update (title, description, assignee, etc.)
// @route   PUT /api/tasks/:id
// @access  ADMIN | PROJECT_MANAGER (project members only)
// ─────────────────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, status, deadline } =
      req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return ApiResponse.error(res, 404, "Task not found");
    }

    // ── Verify project membership ──────────────────────────────
    const { project, error } = await getProjectIfMember(
      task.projectId,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(
        res,
        error === "Project not found" ? 404 : 403,
        error
      );
    }

    // ── Validate new assignee is a project member ──────────────
    if (assignedTo) {
      const assigneeIsMember = project.members.some(
        (m) => m.user.toString() === assignedTo
      );

      if (!assigneeIsMember) {
        return ApiResponse.error(
          res,
          400,
          "Assigned user is not a member of this project"
        );
      }
    }

    // ── Apply updates ──────────────────────────────────────────
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (deadline !== undefined) task.deadline = deadline || null;

    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("projectId", "title");

    return ApiResponse.success(res, 200, "Task updated successfully", {
      task,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update task status only
// @route   PATCH /api/tasks/:id/status
// @access  ADMIN | PROJECT_MANAGER | DEVELOPER (project members)
// ─────────────────────────────────────────────────────────────
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return ApiResponse.error(res, 404, "Task not found");
    }

    // ── Verify project membership ──────────────────────────────
    const { error } = await getProjectIfMember(
      task.projectId,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(
        res,
        error === "Project not found" ? 404 : 403,
        error
      );
    }

    // ── DEVELOPER can only update tasks assigned to them ────────
    // A DEVELOPER should not be able to update status of tasks
    // they are not responsible for
    if (
      req.user.role === "DEVELOPER" &&
      task.assignedTo?.toString() !== req.user.id.toString()
    ) {
      return ApiResponse.error(
        res,
        403,
        "Access denied. You can only update status of tasks assigned to you"
      );
    }

    task.status = status;
    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("projectId", "title");

    return ApiResponse.success(res, 200, "Task status updated successfully", {
      task,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  ADMIN | PROJECT_MANAGER (project members only)
// ─────────────────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return ApiResponse.error(res, 404, "Task not found");
    }

    // ── Verify project membership ──────────────────────────────
    const { error } = await getProjectIfMember(
      task.projectId,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(
        res,
        error === "Project not found" ? 404 : 403,
        error
      );
    }

    // ── Delete all comments on this task first ─────────────────
    // Keeps the database clean — no orphaned comments
    await Comment.deleteMany({ taskId: task._id });

    await Task.findByIdAndDelete(req.params.id);

    return ApiResponse.success(
      res,
      200,
      "Task and all associated comments deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get dashboard stats for current user
// @route   GET /api/tasks/dashboard
// @access  All authenticated users
// ─────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    let projectFilter = {};
    let taskFilter = {};

    // ── Build filters based on role ────────────────────────────
    if (req.user.role !== "ADMIN") {
      const memberProjects = await Project.find({
        "members.user": req.user.id,
      }).select("_id");

      const projectIds = memberProjects.map((p) => p._id);
      projectFilter = { _id: { $in: projectIds } };
      taskFilter = { projectId: { $in: projectIds } };
    }

    // ── Run all stat queries in parallel for performance ────────
    const [
      totalProjects,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      myAssignedTasks,
      overdueTasksCount,
    ] = await Promise.all([
      // Total projects visible to this user
      Project.countDocuments(projectFilter),

      // Total tasks visible to this user
      Task.countDocuments(taskFilter),

      // Task count grouped by status
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Task count grouped by priority
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),

      // Tasks specifically assigned to the current user
      Task.countDocuments({
        ...taskFilter,
        assignedTo: req.user.id,
      }),

      // Overdue tasks (deadline passed and not DONE)
      Task.countDocuments({
        ...taskFilter,
        deadline: { $lt: new Date() },
        status: { $ne: "DONE" },
      }),
    ]);

    // ── Format aggregation results into readable objects ────────
    const statusCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasksByStatus.forEach((item) => {
      if (item._id) statusCounts[item._id] = item.count;
    });

    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    tasksByPriority.forEach((item) => {
      if (item._id) priorityCounts[item._id] = item.count;
    });

    return ApiResponse.success(res, 200, "Dashboard stats fetched", {
      stats: {
        totalProjects,
        totalTasks,
        myAssignedTasks,
        overdueTasksCount,
        tasksByStatus: statusCounts,
        tasksByPriority: priorityCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  getTasksByProject,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getDashboardStats,
};