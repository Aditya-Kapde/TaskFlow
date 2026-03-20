const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");

// Route imports (we will create these in upcoming steps)
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const commentRoutes = require("./routes/commentRoutes");

dotenv.config();
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
// backend/server.js — update the cors config
import cors from "cors";

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, curl)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:3000",
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,   // ← required for cookies to work cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests for all routes
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// ─── Error Handler (must be last middleware) ──────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});