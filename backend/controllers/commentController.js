const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Project = require("../models/Project");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────
// Helper — verify task exists and user is a project member
// This is the core access check for all comment operations
// ─────────────────────────────────────────────────────────────
const verifyTaskAccess = async (taskId, userId, userRole) => {
  // ── Step 1: Find the task ──────────────────────────────────
  const task = await Task.findById(taskId);
  if (!task) {
    return { task: null, error: "Task not found", statusCode: 404 };
  }

  // ── Step 2: ADMIN bypasses membership check ────────────────
  if (userRole === "ADMIN") {
    return { task, error: null, statusCode: null };
  }

  // ── Step 3: Find the project and verify membership ─────────
  const project = await Project.findById(task.projectId);
  if (!project) {
    return { task: null, error: "Project not found", statusCode: 404 };
  }

  const isMember = project.members.some(
    (m) => m.user.toString() === userId.toString()
  );

  if (!isMember) {
    return {
      task: null,
      error: "Access denied. You are not a member of this project",
      statusCode: 403,
    };
  }

  return { task, error: null, statusCode: null };
};

// ─────────────────────────────────────────────────────────────
// @desc    Add a comment to a task
// @route   POST /api/comments
// @access  ADMIN | PROJECT_MANAGER | DEVELOPER (project members)
// ─────────────────────────────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { text, taskId } = req.body;

    // ── Verify access before allowing the comment ──────────────
    const { task, error, statusCode } = await verifyTaskAccess(
      taskId,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(res, statusCode, error);
    }

    // ── Create the comment ─────────────────────────────────────
    const comment = await Comment.create({
      taskId: task._id,
      userId: req.user.id,
      text,
    });

    // ── Populate user info for the response ────────────────────
    // Frontend needs name and email to display who commented
    await comment.populate("userId", "name email role");
    await comment.populate("taskId", "title");

    return ApiResponse.success(res, 201, "Comment added successfully", {
      comment,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Project members only
// ─────────────────────────────────────────────────────────────
const getCommentsByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // ── Verify the user can access this task ───────────────────
    const { error, statusCode } = await verifyTaskAccess(
      taskId,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(res, statusCode, error);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ── Fetch comments sorted oldest first ─────────────────────
    // Oldest first (ascending) makes sense for comments —
    // you read a conversation top to bottom chronologically
    const [comments, total] = await Promise.all([
      Comment.find({ taskId })
        .populate("userId", "name email role")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum),
      Comment.countDocuments({ taskId }),
    ]);

    return ApiResponse.success(res, 200, "Comments fetched successfully", {
      comments,
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
// @desc    Get a single comment by ID
// @route   GET /api/comments/:id
// @access  Project members only
// ─────────────────────────────────────────────────────────────
const getCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("userId", "name email role")
      .populate("taskId", "title status");

    if (!comment) {
      return ApiResponse.error(res, 404, "Comment not found");
    }

    // ── Verify access using the comment's taskId ───────────────
    const { error, statusCode } = await verifyTaskAccess(
      comment.taskId._id,
      req.user.id,
      req.user.role
    );

    if (error) {
      return ApiResponse.error(res, statusCode, error);
    }

    return ApiResponse.success(res, 200, "Comment fetched successfully", {
      comment,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all comments made by the current user
// @route   GET /api/comments/my-comments
// @access  All authenticated users
// ─────────────────────────────────────────────────────────────
const getMyComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      Comment.find({ userId: req.user.id })
        .populate("taskId", "title status projectId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Comment.countDocuments({ userId: req.user.id }),
    ]);

    return ApiResponse.success(res, 200, "Your comments fetched successfully", {
      comments,
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

module.exports = {
  addComment,
  getCommentsByTask,
  getCommentById,
  getMyComments,
};