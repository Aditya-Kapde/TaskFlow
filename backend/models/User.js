const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Creates a unique index in MongoDB
      lowercase: true, // Always store emails in lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "VIEWER"],
        message: "{VALUE} is not a valid role",
      },
      default: "VIEWER",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false, // Never return refresh token in queries by default
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// ─── Pre-save Hook ────────────────────────────────────────────
// Runs automatically before every .save() call
// Only re-hashes if the password field was actually modified
// This prevents re-hashing an already hashed password on profile updates
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Method ──────────────────────────────────────────
// Called on a user document: user.comparePassword(candidatePassword)
// bcrypt.compare handles timing-safe comparison to prevent timing attacks
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;