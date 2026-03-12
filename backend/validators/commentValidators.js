const { body, param } = require("express-validator");

const createCommentValidator = [
  body("text")
    .trim()
    .notEmpty().withMessage("Comment text is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment must be between 1 and 500 characters"),

  body("taskId")
    .notEmpty().withMessage("Task ID is required")
    .isMongoId().withMessage("Invalid task ID format"),
];

const taskIdParamValidator = [
  param("taskId")
    .isMongoId().withMessage("Invalid task ID format"),
];

const commentIdParamValidator = [
  param("id")
    .isMongoId().withMessage("Invalid comment ID format"),
];

module.exports = {
  createCommentValidator,
  taskIdParamValidator,
  commentIdParamValidator,
};