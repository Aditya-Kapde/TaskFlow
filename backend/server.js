// FILE: backend/server.js
//
// WHAT WAS BROKEN:
//   app.options("*", cors())    → crashed on new path-to-regexp
//   app.options("/(.*)", cors()) → also crashed on new path-to-regexp
//
// THE FIX:
//   Remove app.options() entirely.
//   Instead pass { preflightContinue: false, optionsSuccessStatus: 204 }
//   inside the cors() config. This tells the cors middleware to
//   automatically handle all OPTIONS preflight requests itself,
//   without needing a separate route registration.

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
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:3000",
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,           // allows cookies + Authorization header
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,    // cors handles OPTIONS itself — no app.options() needed
  optionsSuccessStatus: 204,   // some browsers (IE11) choke on 204, this is the fix
};

// Apply cors to ALL routes including preflight OPTIONS requests
app.use(cors(corsOptions));

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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// ─── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});