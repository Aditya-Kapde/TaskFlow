const ApiResponse = require("../utils/apiResponse");

// Factory function — takes allowed roles as arguments
// Returns a middleware function that checks req.user.role
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // ─── Guard: authMiddleware must run before this ─────────────
    // If req.user is missing, authMiddleware was not used on this route
    if (!req.user) {
      return ApiResponse.error(res, 401, "Authentication required.");
    }

    // ─── Check if user's role is in the allowed list ───────────
    // allowedRoles is an array like ["ADMIN", "PROJECT_MANAGER"]
    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        403, // 403 Forbidden — authenticated but not authorized
        `Access denied. Required roles: ${allowedRoles.join(", ")}`
      );
    }

    next();
  };
};

module.exports = roleMiddleware;