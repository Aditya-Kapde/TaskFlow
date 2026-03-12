const express = require("express");
const router = express.Router();

const {
  createTask,
  getAllTasks,
  getTaskById,
  getTasksByProject,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getDashboardStats,
} = require("../controllers/taskController");

const authMiddleware     = require("../middleware/authMiddleware");
const roleMiddleware     = require("../middleware/roleMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

const {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  updateTaskStatusValidator,
} = require("../validators/taskValidators");

// ── All task routes require authentication ─────────────────────
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// Dashboard — must be defined BEFORE /:id routes
// Otherwise Express will try to match "dashboard" as a MongoId
// ─────────────────────────────────────────────────────────────
// GET /api/tasks/dashboard
router.get("/dashboard", getDashboardStats);

// ─────────────────────────────────────────────────────────────
// Core task routes
// ─────────────────────────────────────────────────────────────

// GET /api/tasks
// ADMIN sees all | others filtered by project membership
router.get("/", getAllTasks);

// POST /api/tasks
// Only ADMIN and PROJECT_MANAGER can create tasks
router.post(
  "/",
  roleMiddleware("ADMIN", "PROJECT_MANAGER"),
  createTaskValidator,
  validateMiddleware,
  createTask
);

// GET /api/tasks/project/:projectId
// All members of the project can view its tasks
router.get(
  "/project/:projectId",
  getTasksByProject
);

// GET /api/tasks/:id
router.get(
  "/:id",
  taskIdValidator,
  validateMiddleware,
  getTaskById
);

// PUT /api/tasks/:id
// Full update — ADMIN and PROJECT_MANAGER only
router.put(
  "/:id",
  roleMiddleware("ADMIN", "PROJECT_MANAGER"),
  updateTaskValidator,
  validateMiddleware,
  updateTask
);

// PATCH /api/tasks/:id/status
// Status-only update — DEVELOPER can also use this
// But controller further restricts DEVELOPER to only
// update tasks that are assigned to them
router.patch(
  "/:id/status",
  roleMiddleware("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
  updateTaskStatusValidator,
  validateMiddleware,
  updateTaskStatus
);

// DELETE /api/tasks/:id
// Only ADMIN and PROJECT_MANAGER can delete tasks
router.delete(
  "/:id",
  roleMiddleware("ADMIN", "PROJECT_MANAGER"),
  taskIdValidator,
  validateMiddleware,
  deleteTask
);

module.exports = router;
// ```

// ---

// ## Step 6.4 — Updated folder structure
// ```
// backend/
// ├── config/
// │   └── db.js                        ✅
// ├── controllers/
// │   ├── authController.js            ✅
// │   ├── userController.js            ✅
// │   ├── projectController.js         ✅
// │   └── taskController.js            ✅ NEW
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
// │   ├── taskRoutes.js                ✅ UPDATED
// │   └── commentRoutes.js             ✅ (placeholder)
// ├── services/
// │   └── tokenService.js              ✅
// ├── validators/
// │   ├── authValidators.js            ✅
// │   ├── userValidators.js            ✅
// │   ├── projectValidators.js         ✅
// │   └── taskValidators.js            ✅ NEW
// ├── utils/
// │   └── apiResponse.js               ✅
// ├── .env                             ✅
// └── server.js                        ✅
// ```

// ---

// ## Step 6.5 — RBAC permission map for tasks

// This table shows exactly who can do what on every task endpoint:
// ```
// Endpoint                        ADMIN   PM     DEV    VIEWER
// ─────────────────────────────────────────────────────────────
// POST   /tasks                    ✅     ✅      ❌      ❌
// GET    /tasks                    ✅     ✅      ✅      ✅
// GET    /tasks/dashboard          ✅     ✅      ✅      ✅
// GET    /tasks/project/:id        ✅     ✅      ✅      ✅
// GET    /tasks/:id                ✅     ✅      ✅      ✅
// PUT    /tasks/:id                ✅     ✅      ❌      ❌
// PATCH  /tasks/:id/status         ✅     ✅      ✅*     ❌
// DELETE /tasks/:id                ✅     ✅      ❌      ❌

// * DEVELOPER can only update status of tasks assigned to them
//   PM = PROJECT_MANAGER
// ```

// ---

// ## Step 6.6 — Test the task endpoints

// ### Setup
// Make sure you have from previous steps:
// - `<admin_token>` — from logging in as admin
// - `<project_id>` — from creating a project in Step 5
// - `<developer_user_id>` — from registering the developer user

// ---

// ### Test 1 — Create a task
// ```
// POST http://localhost:5000/api/tasks
// Authorization: Bearer <admin_token>
// Content-Type: application/json

// {
//   "title": "Design homepage wireframe",
//   "description": "Create initial wireframes for the homepage redesign",
//   "projectId": "<project_id>",
//   "priority": "HIGH",
//   "status": "TODO",
//   "deadline": "2026-12-01"
// }
// ```
// Save the `id` from the response as `<task_id>`.

// ---

// ### Test 2 — Create a task with assignee
// First add the developer to the project (Step 5 Test 5), then:
// ```
// POST http://localhost:5000/api/tasks
// Authorization: Bearer <admin_token>
// Content-Type: application/json

// {
//   "title": "Build navigation component",
//   "projectId": "<project_id>",
//   "assignedTo": "<developer_user_id>",
//   "priority": "MEDIUM",
//   "deadline": "2026-11-15"
// }
// ```

// ---

// ### Test 3 — Get all tasks
// ```
// GET http://localhost:5000/api/tasks
// Authorization: Bearer <admin_token>
// ```

// ---

// ### Test 4 — Get tasks for a specific project
// ```
// GET http://localhost:5000/api/tasks/project/<project_id>
// Authorization: Bearer <admin_token>
// ```

// ---

// ### Test 5 — Get dashboard stats
// ```
// GET http://localhost:5000/api/tasks/dashboard
// Authorization: Bearer <admin_token>