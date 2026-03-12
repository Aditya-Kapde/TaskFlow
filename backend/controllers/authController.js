const User = require("../models/User");
const tokenService = require("../services/tokenService");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Check if email already exists ──────────────────────────
    // We do this manually to return a clear error message
    // MongoDB unique index would also catch this, but gives a
    // less user-friendly error
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 409, "Email is already registered");
    }

    // ── Create user ────────────────────────────────────────────
    // Password hashing happens automatically in the pre-save hook
    // We never call bcrypt.hash() here
    const user = await User.create({
      name,
      email,
      password,
      role: role || "VIEWER", // Default to VIEWER if no role provided
    });

    // ── Generate tokens ────────────────────────────────────────
    const payload = { id: user._id, role: user.role };
    const accessToken = tokenService.generateAccessToken(payload);
    const refreshToken = tokenService.generateRefreshToken(payload);

    // ── Save refresh token to database ─────────────────────────
    // Storing it in DB lets us invalidate it on logout
    // If we did not store it, any refresh token signed with our
    // secret would be valid forever until it expires
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // ── Set refresh token in httpOnly cookie ───────────────────
    tokenService.setRefreshTokenCookie(res, refreshToken);

    // ── Return response ────────────────────────────────────────
    // Never return password or refreshToken in the response body
    return ApiResponse.success(res, 201, "Registration successful", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    next(error); // Pass to global error middleware
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Find user and explicitly select password ────────────────
    // Password has select: false in the schema
    // We must use .select("+password") to include it here
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      // Use a vague message intentionally — do not reveal
      // whether the email exists or the password is wrong
      // This prevents user enumeration attacks
      return ApiResponse.error(res, 401, "Invalid email or password");
    }

    // ── Check account is active ────────────────────────────────
    if (!user.isActive) {
      return ApiResponse.error(res, 403, "Account has been deactivated. Contact admin.");
    }

    // ── Compare password ───────────────────────────────────────
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return ApiResponse.error(res, 401, "Invalid email or password");
    }

    // ── Generate tokens ────────────────────────────────────────
    const payload = { id: user._id, role: user.role };
    const accessToken = tokenService.generateAccessToken(payload);
    const refreshToken = tokenService.generateRefreshToken(payload);

    // ── Update refresh token in database ──────────────────────
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // ── Set refresh token cookie ───────────────────────────────
    tokenService.setRefreshTokenCookie(res, refreshToken);

    return ApiResponse.success(res, 200, "Login successful", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (uses httpOnly cookie)
// ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    // ── Extract refresh token from cookie ──────────────────────
    // The browser sends this automatically with every request
    // JavaScript on the frontend cannot read or steal this cookie
    const token = req.cookies.refreshToken;

    if (!token) {
      return ApiResponse.error(res, 401, "Refresh token not found. Please login again.");
    }

    // ── Verify the refresh token signature ─────────────────────
    let decoded;
    try {
      decoded = tokenService.verifyRefreshToken(token);
    } catch (err) {
      return ApiResponse.error(res, 401, "Invalid or expired refresh token. Please login again.");
    }

    // ── Find user and verify stored token matches ───────────────
    // This check means logging out truly invalidates the token
    // Even if someone stole the refresh token, it won't work
    // after the user logs out because we clear it from the DB
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return ApiResponse.error(res, 401, "Refresh token is no longer valid. Please login again.");
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 403, "Account has been deactivated.");
    }

    // ── Issue new access token ─────────────────────────────────
    const payload = { id: user._id, role: user.role };
    const newAccessToken = tokenService.generateAccessToken(payload);

    // ── Rotate the refresh token ───────────────────────────────
    // Refresh token rotation means every refresh issues a NEW
    // refresh token and invalidates the old one.
    // This limits the damage if a refresh token is ever stolen.
    const newRefreshToken = tokenService.generateRefreshToken(payload);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
    tokenService.setRefreshTokenCookie(res, newRefreshToken);

    return ApiResponse.success(res, 200, "Token refreshed successfully", {
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // ── Clear refresh token from database ──────────────────────
    // This invalidates the token server-side
    // Even if someone has the old cookie, it will not work
    await User.findByIdAndUpdate(
      req.user.id,
      { refreshToken: null },
      { new: true }
    );

    // ── Clear cookie from browser ──────────────────────────────
    tokenService.clearRefreshTokenCookie(res);

    return ApiResponse.success(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is already attached by authMiddleware
    // We re-fetch from DB to always return the latest data
    const user = await User.findById(req.user.id);

    if (!user) {
      return ApiResponse.error(res, 404, "User not found");
    }

    return ApiResponse.success(res, 200, "User profile fetched", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };