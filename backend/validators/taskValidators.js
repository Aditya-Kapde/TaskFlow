const { body, param } = require("express-validator");

const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Task title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("projectId")
    .notEmpty().withMessage("Project ID is required")
    .isMongoId().withMessage("Invalid project ID format"),

  body("assignedTo")
    .optional()
    .isMongoId().withMessage("Invalid user ID format"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Priority must be LOW, MEDIUM, HIGH or CRITICAL"),

  body("status")
    .optional()
    .isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .withMessage("Status must be TODO, IN_PROGRESS, IN_REVIEW or DONE"),

  body("deadline")
    .optional()
    .isISO8601().withMessage("Deadline must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Deadline must be a future date");
      }
      return true;
    }),
];

const updateTaskValidator = [
  param("id")
    .isMongoId().withMessage("Invalid task ID format"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("assignedTo")
    .optional()
    .isMongoId().withMessage("Invalid user ID format"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Priority must be LOW, MEDIUM, HIGH or CRITICAL"),

  body("status")
    .optional()
    .isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .withMessage("Status must be TODO, IN_PROGRESS, IN_REVIEW or DONE"),

  body("deadline")
    .optional()
    .isISO8601().withMessage("Deadline must be a valid date (YYYY-MM-DD)"),
];

// Used for routes that only need to validate the task ID param
const taskIdValidator = [
  param("id")
    .isMongoId().withMessage("Invalid task ID format"),
];

// DEVELOPER can only update status — nothing else
const updateTaskStatusValidator = [
  param("id")
    .isMongoId().withMessage("Invalid task ID format"),

  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .withMessage("Status must be TODO, IN_PROGRESS, IN_REVIEW or DONE"),
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  updateTaskStatusValidator,
};