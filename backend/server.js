// FILE: backend/server.js
//
// WHAT WAS BROKEN:
//   The line "import cors from 'cors';" was accidentally pasted into
//   the middle of the file. Your entire backend uses CommonJS (require)
//   syntax — you cannot mix "import" and "require" in the same file.
//   Node.js sees the import statement and throws:
//     SyntaxError: Cannot use import statement outside a module
//
// THE FIX:
//   Remove the rogue "import cors from 'cors'" line entirely.
//   cors is already loaded on line 2 via require("cors").
//   The new cors config block replaces the old one cleanly.

const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const dotenv       = require("dotenv");
const connectDB    = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");

const authRoutes    = require("./routes/authRoutes");
const userRoutes    = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes    = require("./routes/taskRoutes");
const commentRoutes = require("./routes/commentRoutes");

dotenv.config();
connectDB();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────
// credentials: true  → allows cookies to be sent cross-origin
// origin function    → only allows your Vercel frontend + localhost
// sameSite "none" in the cookie (tokenService.js) requires HTTPS,
// which both Vercel and Render provide automatically.
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl, mobile apps)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.CLIENT_URL,   // your Vercel URL set in Render env vars
        "http://localhost:3000",  // local development
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,  // required — allows Authorization header + cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight OPTIONS requests for every route
// Browsers send a preflight before POST/PUT/PATCH with credentials
// ✅ REPLACE WITH THIS
app.options("/(.*)", cors());

// ─── Body parsers ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks",    taskRoutes);
app.use("/api/comments", commentRoutes);

// Health check — useful to verify the backend is alive
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// ─── Error Handler ────────────────────────────────────────────
// Must be the last middleware registered
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});