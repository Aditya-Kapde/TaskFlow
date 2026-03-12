const { validationResult } = require("express-validator");
const ApiResponse = require("../utils/apiResponse");

// Reads validation errors collected by express-validator rules
// If errors exist, return 400 immediately — never reach the controller
const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return ApiResponse.error(res, 400, "Validation failed", extractedErrors);
  }

  next();
};

module.exports = validateMiddleware;
// ```

// ---

// ## Your current file structure

// Everything you have built so far:

// ```
// backend/
// ├── config/
// │   └── db.js                    ✅
// ├── middleware/
// │   ├── authMiddleware.js         ✅
// │   ├── roleMiddleware.js         ✅
// │   ├── errorMiddleware.js        ✅
// │   └── validateMiddleware.js     ✅
// ├── models/
// │   └── User.js                  ✅
// ├── routes/
// │   ├── authRoutes.js            ✅ (placeholder)
// │   ├── userRoutes.js            ✅ (placeholder)
// │   ├── projectRoutes.js         ✅ (placeholder)
// │   ├── taskRoutes.js            ✅ (placeholder)
// │   └── commentRoutes.js         ✅ (placeholder)
// ├── services/
// │   └── tokenService.js          ✅
// ├── utils/
// │   └── apiResponse.js           ✅
// ├── .env                         ✅
// └── server.js                    ✅
// ```

// ---

// ## How these pieces connect
// ```
// Incoming Request
//       │
//       ▼
//   authMiddleware          → Verifies JWT, attaches req.user
//       │
//       ▼
//   roleMiddleware(...)     → Checks req.user.role against allowed roles
//       │
//       ▼
//   validateMiddleware      → Checks request body fields
//       │
//       ▼
//   Controller              → Runs business logic
//       │
//       ▼
//   ApiResponse             → Sends consistent JSON response
  