const { body, param } = require("express-validator");

const createProjectValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Project title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("deadline")
    .optional()
    .isISO8601().withMessage("Deadline must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      // Deadline must be in the future
      if (new Date(value) < new Date()) {
        throw new Error("Deadline must be a future date");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"])
    .withMessage("Invalid status value"),
];

const updateProjectValidator = [
  param("id")
    .isMongoId().withMessage("Invalid project ID format"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("deadline")
    .optional()
    .isISO8601().withMessage("Deadline must be a valid date (YYYY-MM-DD)"),

  body("status")
    .optional()
    .isIn(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"])
    .withMessage("Invalid status value"),
];

const addMemberValidator = [
  param("id")
    .isMongoId().withMessage("Invalid project ID format"),

  body("userId")
    .notEmpty().withMessage("User ID is required")
    .isMongoId().withMessage("Invalid user ID format"),

  body("role")
    .optional()
    .isIn(["PROJECT_MANAGER", "DEVELOPER", "VIEWER"])
    .withMessage("Invalid member role"),
];

const projectIdValidator = [
  param("id")
    .isMongoId().withMessage("Invalid project ID format"),
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  addMemberValidator,
  projectIdValidator,
};