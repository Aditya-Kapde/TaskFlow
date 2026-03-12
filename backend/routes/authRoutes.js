const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const validateMiddleware = require("../middleware/validateMiddleware");

const {
  registerValidator,
  loginValidator,
} = require("../validators/authValidators");

// ─── Public Routes ────────────────────────────────────────────
// No authMiddleware — anyone can hit these

// POST /api/auth/register
router.post(
  "/register",
  registerValidator,       // Step 1: Validate inputs
  validateMiddleware,      // Step 2: Check for validation errors
  register                 // Step 3: Run controller
);

// POST /api/auth/login
router.post(
  "/login",
  loginValidator,
  validateMiddleware,
  login
);

// POST /api/auth/refresh
// Uses the httpOnly cookie automatically sent by the browser
router.post("/refresh", refreshToken);

// ─── Protected Routes ─────────────────────────────────────────
// authMiddleware runs first — verifies JWT and attaches req.user

// POST /api/auth/logout
router.post("/logout", authMiddleware, logout);

// GET /api/auth/me
router.get("/me", authMiddleware, getMe);

module.exports = router;


// ## Step 3.4 — Updated folder structure

// backend/
// ├── config/
// │   └── db.js                     ✅
// ├── controllers/
// │   └── authController.js         ✅ NEW
// ├── middleware/
// │   ├── authMiddleware.js          ✅
// │   ├── roleMiddleware.js          ✅
// │   ├── errorMiddleware.js         ✅
// │   └── validateMiddleware.js      ✅
// ├── models/
// │   └── User.js                   ✅
// ├── routes/
// │   ├── authRoutes.js             ✅ UPDATED (real routes)
// │   ├── userRoutes.js             ✅ (placeholder)
// │   ├── projectRoutes.js          ✅ (placeholder)
// │   ├── taskRoutes.js             ✅ (placeholder)
// │   └── commentRoutes.js          ✅ (placeholder)
// ├── services/
// │   └── tokenService.js           ✅
// ├── validators/
// │   └── authValidators.js         ✅ NEW
// ├── utils/
// │   └── apiResponse.js            ✅
// ├── .env                          ✅
// └── server.js                     ✅
// ```

// ---

// ## Step 3.5 — How all the pieces flow together

// Here is exactly what happens during each request:

// ### Register Flow
// ```
// POST /api/auth/register
//         │
//         ▼
// registerValidator        → Validates name, email, password, role
//         │
//         ▼
// validateMiddleware       → If errors exist, return 400 immediately
//         │
//         ▼
// register()               → Check email not taken
//         │                  Create user (password auto-hashed by pre-save hook)
//         │                  Generate access token + refresh token
//         │                  Save refresh token to DB
//         │                  Set refresh token in httpOnly cookie
//         │                  Return { user, accessToken }
//         ▼
// ApiResponse.success(201)
// ```

// ### Login Flow
// ```
// POST /api/auth/login
//         │
//         ▼
// loginValidator           → Validates email, password fields
//         │
//         ▼
// validateMiddleware       → If errors exist, return 400
//         │
//         ▼
// login()                  → Find user by email
//         │                  Check account is active
//         │                  Compare password with bcrypt
//         │                  Generate new access + refresh tokens
//         │                  Save refresh token to DB
//         │                  Set cookie
//         │                  Return { user, accessToken }
//         ▼
// ApiResponse.success(200)
// ```

// ### Refresh Token Flow
// ```
// POST /api/auth/refresh
//         │
//         ▼
// refreshToken()           → Read refresh token from httpOnly cookie
//         │                  Verify token signature
//         │                  Find user, confirm DB token matches cookie token
//         │                  Issue new access token
//         │                  Rotate refresh token (new token, invalidate old)
//         │                  Return { accessToken }
//         ▼
// ApiResponse.success(200)
// ```

// ### Logout Flow
// ```
// POST /api/auth/logout
//         │
//         ▼
// authMiddleware           → Verify access token, attach req.user
//         │
//         ▼
// logout()                 → Set refreshToken = null in DB
//         │                  Clear cookie from browser
//         ▼
// ApiResponse.success(200)