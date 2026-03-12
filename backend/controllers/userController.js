const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────
// @desc    Get all users
// @route   GET /api/users
// @access  ADMIN only
// ─────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    // ── Query filters from request ─────────────────────────────
    const { role, isActive, search, page = 1, limit = 10 } = req.query;

    const filter = {};

    // Filter by role if provided
    if (role) filter.role = role;

    // Filter by active status if provided
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },  // case-insensitive
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // ── Pagination ─────────────────────────────────────────────
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-refreshToken")   // Never expose refresh token
        .sort({ createdAt: -1 })   // Newest first
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return ApiResponse.success(res, 200, "Users fetched successfully", {
      users,
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
// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  ADMIN only
// ─────────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-refreshToken");

    if (!user) {
      return ApiResponse.error(res, 404, "User not found");
    }

    return ApiResponse.success(res, 200, "User fetched successfully", { user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  ADMIN only
// ─────────────────────────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    // ── Prevent admin from changing their own role ──────────────
    // Accidental self-demotion would lock the admin out
    if (targetUserId === req.user.id.toString()) {
      return ApiResponse.error(
        res,
        400,
        "You cannot change your own role"
      );
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return ApiResponse.error(res, 404, "User not found");
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, 200, "User role updated successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Deactivate a user (soft delete)
// @route   PATCH /api/users/:id/deactivate
// @access  ADMIN only
// ─────────────────────────────────────────────────────────────
const deactivateUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // ── Prevent admin from deactivating themselves ──────────────
    if (targetUserId === req.user.id.toString()) {
      return ApiResponse.error(
        res,
        400,
        "You cannot deactivate your own account"
      );
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return ApiResponse.error(res, 404, "User not found");
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 400, "User is already deactivated");
    }

    // ── Soft delete — we never hard delete users ────────────────
    // Hard deleting a user would break references in projects,
    // tasks, and comments. Soft delete preserves data integrity.
    user.isActive = false;
    user.refreshToken = null; // Invalidate their session immediately
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, 200, "User deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Reactivate a user
// @route   PATCH /api/users/:id/activate
// @access  ADMIN only
// ─────────────────────────────────────────────────────────────
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return ApiResponse.error(res, 404, "User not found");
    }

    if (user.isActive) {
      return ApiResponse.error(res, 400, "User is already active");
    }

    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, 200, "User activated successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update user name or email
// @route   PATCH /api/users/:id
// @access  ADMIN only
// ─────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return ApiResponse.error(res, 404, "User not found");
    }

    // ── Check email uniqueness if email is being changed ────────
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return ApiResponse.error(res, 409, "Email is already in use");
      }
      user.email = email;
    }

    if (name) user.name = name;

    await user.save({ validateBeforeSave: false });

    return ApiResponse.success(res, 200, "User updated successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  activateUser,
  updateUser,
};