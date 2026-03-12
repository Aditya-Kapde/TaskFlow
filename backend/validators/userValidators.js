const { body, param } = require("express-validator");

const updateRoleValidator = [
  param("id")
    .isMongoId().withMessage("Invalid user ID format"),

  body("role")
    .notEmpty().withMessage("Role is required")
    .isIn(["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "VIEWER"])
    .withMessage("Invalid role. Must be ADMIN, PROJECT_MANAGER, DEVELOPER, or VIEWER"),
];

const updateUserValidator = [
  param("id")
    .isMongoId().withMessage("Invalid user ID format"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),
];

module.exports = { updateRoleValidator, updateUserValidator };