const ApiResponse = require("../utils/apiResponse");

// Centralized error handler — Express calls this when next(error) is called
// Having one place for error handling avoids scattered try/catch responses
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.error(res, 400, "Validation Error", errors);
  }

  // Mongoose duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, 409, `${field} already exists`);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return ApiResponse.error(res, 401, "Invalid token");
  }
  if (err.name === "TokenExpiredError") {
    return ApiResponse.error(res, 401, "Token expired");
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return ApiResponse.error(res, statusCode, message);
};

module.exports = errorHandler;