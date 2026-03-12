const express = require("express");
const router = express.Router();

const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectMembers,
} = require("../controllers/projectController");

const authMiddleware    = require("../middleware/authMiddleware");
const roleMiddleware    = require("../middleware/roleMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

const {
  createProjectValidator,
  updateProjectValidator,
  addMemberValidator,
  projectIdValidator,
} = require("../validators/projectValidators");

// ── All project routes require authentication ──────────────────
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// Core project CRUD
// ─────────────────────────────────────────────────────────────

// GET /api/projects
// ADMIN sees all | others see only their projects
router.get("/", getAllProjects);

// POST /api/projects
// Only ADMIN and PROJECT_MANAGER can create projects
router.post(
  "/",
  roleMiddleware("ADMIN", "PROJECT_MANAGER"),
  createProjectValidator,
  validateMiddleware,
  createProject
);

// GET /api/projects/:id
// Auth check + membership check happens inside controller
router.get(
  "/:id",
  projectIdValidator,
  validateMiddleware,
  getProjectById
);

// PUT /api/projects/:id
// Only ADMIN and PROJECT_MANAGER can update
// Membership check happens inside controller
router.put(
  "/:id",
  roleMiddleware("ADMIN", "PROJECT_MANAGER"),
  updateProjectValidator,
  validateMiddleware,
  updateProject
);

// DELETE /api/projects/:id
// Only ADMIN can delete a project entirely
router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  projectIdValidator,
  validateMiddleware,
  deleteProject
);

// ─────────────────────────────────────────────────────────────
// Member management routes
// ─────────────────────────────────────────────────────────────

// GET /api/projects/:id/members
router.get(
  "/:id/members",
  projectIdValidator,
  validateMiddleware,
  getProjectMembers
);

// POST /api/projects/:id/members
// Only ADMIN and PROJECT_MANAGER can add members
router.post(
  "/:id/members",
  roleMiddleware("ADMIN", "PROJECT_MANAGER"),
  addMemberValidator,
  validateMiddleware,
  addMember
);

// DELETE /api/projects/:id/members/:userId
// Only ADMIN and PROJECT_MANAGER can remove members
router.delete(
  "/:id/members/:userId",
  roleMiddleware("ADMIN", "PROJECT_MANAGER"),
  projectIdValidator,
  validateMiddleware,
  removeMember
);

module.exports = router;
// ```

// ---

// ## Step 5.4 — Updated folder structure
// ```
// backend/
// ├── config/
// │   └── db.js                        ✅
// ├── controllers/
// │   ├── authController.js            ✅
// │   ├── userController.js            ✅
// │   └── projectController.js         ✅ NEW
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
// │   ├── projectRoutes.js             ✅ UPDATED
// │   ├── taskRoutes.js                ✅ (placeholder)
// │   └── commentRoutes.js             ✅ (placeholder)
// ├── services/
// │   └── tokenService.js              ✅
// ├── validators/
// │   ├── authValidators.js            ✅
// │   ├── userValidators.js            ✅
// │   └── projectValidators.js         ✅ NEW
// ├── utils/
// │   └── apiResponse.js               ✅
// ├── .env                             ✅
// └── server.js                        ✅
// ```

// ---

// ## Step 5.5 — Complete API reference for testing

// ### Setup before testing
// First login as ADMIN and save the token:
// ```
// POST http://localhost:5000/api/auth/login
// Content-Type: application/json

// {
//   "email": "admin@test.com",
//   "password": "password123"
// }
// ```
// Copy the `accessToken` from the response. Every request below needs this in the header:
// ```
// Authorization: Bearer <your_admin_token_here>
// ```

// ---

// ### Test 1 — Create a project
// ```
// POST http://localhost:5000/api/projects
// Authorization: Bearer <admin_token>
// Content-Type: application/json

// {
//   "title": "Website Redesign",
//   "description": "Complete overhaul of the company website",
//   "deadline": "2026-12-31",
//   "status": "PLANNING"
// }