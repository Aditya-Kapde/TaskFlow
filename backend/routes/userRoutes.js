const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  activateUser,
  updateUser,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

const {
  updateRoleValidator,
  updateUserValidator,
} = require("../validators/userValidators");

// ─── All user routes require authentication ───────────────────
// Applying authMiddleware at router level means every route
// below this line is automatically protected — no need to
// repeat it on each individual route
router.use(authMiddleware);

// ─── All user management is ADMIN only ───────────────────────
// GET /api/users
router.get(
  "/",
  roleMiddleware("ADMIN"),
  getAllUsers
);

// GET /api/users/:id
router.get(
  "/:id",
  roleMiddleware("ADMIN"),
  getUserById
);

// PATCH /api/users/:id
router.patch(
  "/:id",
  roleMiddleware("ADMIN"),
  updateUserValidator,
  validateMiddleware,
  updateUser
);

// PATCH /api/users/:id/role
router.patch(
  "/:id/role",
  roleMiddleware("ADMIN"),
  updateRoleValidator,
  validateMiddleware,
  updateUserRole
);

// PATCH /api/users/:id/deactivate
router.patch(
  "/:id/deactivate",
  roleMiddleware("ADMIN"),
  deactivateUser
);

// PATCH /api/users/:id/activate
router.patch(
  "/:id/activate",
  roleMiddleware("ADMIN"),
  activateUser
);

module.exports = router;
// ```

// ---

// ## Step 4.7 — Full updated folder structure
// ```
// backend/
// ├── config/
// │   └── db.js                        ✅
// ├── controllers/
// │   ├── authController.js            ✅
// │   └── userController.js            ✅ NEW
// ├── middleware/
// │   ├── authMiddleware.js             ✅
// │   ├── roleMiddleware.js             ✅
// │   ├── errorMiddleware.js            ✅
// │   └── validateMiddleware.js         ✅
// ├── models/
// │   ├── User.js                      ✅
// │   ├── Project.js                   ✅ NEW
// │   ├── Task.js                      ✅ NEW
// │   └── Comment.js                   ✅ NEW
// ├── routes/
// │   ├── authRoutes.js                ✅
// │   ├── userRoutes.js                ✅ UPDATED
// │   ├── projectRoutes.js             ✅ (placeholder)
// │   ├── taskRoutes.js                ✅ (placeholder)
// │   └── commentRoutes.js             ✅ (placeholder)
// ├── services/
// │   └── tokenService.js              ✅
// ├── validators/
// │   ├── authValidators.js            ✅
// │   └── userValidators.js            ✅ NEW
// ├── utils/
// │   └── apiResponse.js               ✅
// ├── .env                             ✅
// └── server.js                        ✅
// ```

// ---

// ## Step 4.8 — Test the user endpoints

// Start your server and register two users — one ADMIN and one DEVELOPER.

// **Register an ADMIN user first:**
// ```
// POST http://localhost:5000/api/auth/register
// Content-Type: application/json

// {
//   "name": "John Admin",
//   "email": "admin@test.com",
//   "password": "password123",
//   "role": "ADMIN"
// }
// ```

// **Register a DEVELOPER user:**
// ```
// POST http://localhost:5000/api/auth/register
// Content-Type: application/json

// {
//   "name": "Jane Developer",
//   "email": "dev@test.com",
//   "password": "password123",
//   "role": "DEVELOPER"
// }
// ```

// **Login as ADMIN and copy the accessToken:**
// ```
// POST http://localhost:5000/api/auth/login
// Content-Type: application/json

// {
//   "email": "admin@test.com",
//   "password": "password123"
// }
// ```

// **Get all users — use ADMIN token:**
// ```
// GET http://localhost:5000/api/users
// Authorization: Bearer <admin_access_token>
// ```

// **Try the same with DEVELOPER token — should return 403:**
// ```
// GET http://localhost:5000/api/users
// Authorization: Bearer <developer_access_token>

// // Expected response:
// {
//   "success": false,
//   "message": "Access denied. Required roles: ADMIN"
// }
// ```

// **Update user role:**
// ```
// PATCH http://localhost:5000/api/users/<developer_user_id>/role
// Authorization: Bearer <admin_access_token>
// Content-Type: application/json

// {
//   "role": "PROJECT_MANAGER"
// }
// ```

// **Deactivate a user:**
// ```
// PATCH http://localhost:5000/api/users/<developer_user_id>/deactivate
// Authorization: Bearer <admin_access_token>
// ```

// ---

// ## How the middleware chain looks on a real request
// ```
// PATCH /api/users/:id/role
//           │
//           ▼
//     authMiddleware        → Verifies JWT, attaches req.user
//           │
//           ▼
//     roleMiddleware        → Confirms req.user.role === "ADMIN"
//     ("ADMIN")               If not → 403 Forbidden
//           │
//           ▼
//     updateRoleValidator   → Validates :id is a MongoId
//                             Validates role is a valid enum value
//           │
//           ▼
//     validateMiddleware    → If errors exist → 400 Bad Request
//           │
//           ▼
//     updateUserRole()      → Runs business logic, returns response