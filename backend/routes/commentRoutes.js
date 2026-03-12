const express = require("express");
const router = express.Router();

const {
  addComment,
  getCommentsByTask,
  getCommentById,
  getMyComments,
} = require("../controllers/commentController");

const authMiddleware     = require("../middleware/authMiddleware");
const roleMiddleware     = require("../middleware/roleMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

const {
  createCommentValidator,
  taskIdParamValidator,
  commentIdParamValidator,
} = require("../validators/commentValidators");

// ── All comment routes require authentication ──────────────────
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// GET /api/comments/my-comments
// Must be defined BEFORE /:id to avoid route conflict
// ─────────────────────────────────────────────────────────────
router.get("/my-comments", getMyComments);

// ─────────────────────────────────────────────────────────────
// POST /api/comments
// VIEWER cannot comment — they can only read
// Everyone else who is a project member can comment
// ─────────────────────────────────────────────────────────────
router.post(
  "/",
  roleMiddleware("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
  createCommentValidator,
  validateMiddleware,
  addComment
);

// ─────────────────────────────────────────────────────────────
// GET /api/comments/task/:taskId
// All roles can read comments — including VIEWER
// Access is filtered by project membership in controller
// ─────────────────────────────────────────────────────────────
router.get(
  "/task/:taskId",
  taskIdParamValidator,
  validateMiddleware,
  getCommentsByTask
);

// ─────────────────────────────────────────────────────────────
// GET /api/comments/:id
// All roles can read a single comment
// ─────────────────────────────────────────────────────────────
router.get(
  "/:id",
  commentIdParamValidator,
  validateMiddleware,
  getCommentById
);

module.exports = router;
// ```

// ---

// ## Step 7.4 — Complete final folder structure

// The entire backend is now complete. Here is the full picture:
// ```
// backend/
// ├── config/
// │   └── db.js                        ✅
// ├── controllers/
// │   ├── authController.js            ✅
// │   ├── userController.js            ✅
// │   ├── projectController.js         ✅
// │   ├── taskController.js            ✅
// │   └── commentController.js         ✅ NEW
// ├── middleware/
// │   ├── authMiddleware.js             ✅
// │   ├── roleMiddleware.js             ✅
// │   ├── errorMiddleware.js            ✅
// │   └── validateMiddleware.js         ✅
// ├── models/
// │   ├── User.js                      ✅
// │   ├── Project.js                   ✅
// │   ├── Task.js                      ✅
// │   └── Comment.js                   ✅
// ├── routes/
// │   ├── authRoutes.js                ✅
// │   ├── userRoutes.js                ✅
// │   ├── projectRoutes.js             ✅
// │   ├── taskRoutes.js                ✅
// │   └── commentRoutes.js             ✅ UPDATED
// ├── services/
// │   └── tokenService.js              ✅
// ├── validators/
// │   ├── authValidators.js            ✅
// │   ├── userValidators.js            ✅
// │   ├── projectValidators.js         ✅
// │   ├── taskValidators.js            ✅
// │   └── commentValidators.js         ✅ NEW
// ├── utils/
// │   └── apiResponse.js               ✅
// ├── .env                             ✅
// └── server.js                        ✅
// ```

// ---

// ## Step 7.5 — RBAC permission map for comments
// ```
// Endpoint                          ADMIN   PM     DEV    VIEWER
// ───────────────────────────────────────────────────────────────
// POST   /comments                   ✅     ✅      ✅      ❌
// GET    /comments/task/:taskId       ✅     ✅      ✅      ✅
// GET    /comments/:id                ✅     ✅      ✅      ✅
// GET    /comments/my-comments        ✅     ✅      ✅      ✅

// All of the above also require project membership
// PM = PROJECT_MANAGER
// ```

// ---

// ## Step 7.6 — Test the comment endpoints

// ### Setup
// You need from previous steps:
// - `<admin_token>` — from logging in as admin
// - `<developer_token>` — from logging in as developer
// - `<task_id>` — from creating a task in Step 6

// ---

// ### Test 1 — Add a comment as ADMIN
// ```
// POST http://localhost:5000/api/comments
// Authorization: Bearer <admin_token>
// Content-Type: application/json

// {
//   "taskId": "<task_id>",
//   "text": "This task needs to follow the new brand guidelines"
// }