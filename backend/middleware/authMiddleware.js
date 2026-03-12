const tokenService = require("../services/tokenService");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");

const authMiddleware = async (req, res, next) => {
  try {
    // ─── Step 1: Extract token from header ─────────────────────
    // Clients send: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.error(res, 401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1]; // Extract just the token part

    if (!token) {
      return ApiResponse.error(res, 401, "Access denied. Token missing.");
    }

    // ─── Step 2: Verify the token ──────────────────────────────
    // verifyAccessToken throws if token is expired or tampered
    const decoded = tokenService.verifyAccessToken(token);

    // ─── Step 3: Check user still exists and is active ─────────
    // Important: user could be deactivated after token was issued
    // We re-check the database to confirm the user is still valid
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return ApiResponse.error(res, 401, "User no longer exists.");
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 403, "Account has been deactivated.");
    }

    // ─── Step 4: Attach user to request ────────────────────────
    // Controllers can now access req.user.id, req.user.role, etc.
    req.user = user;
    next();
  } catch (error) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    // These are handled by our global error middleware
    next(error);
  }
};

module.exports = authMiddleware;