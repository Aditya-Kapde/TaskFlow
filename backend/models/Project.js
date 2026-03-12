const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["PROJECT_MANAGER", "DEVELOPER", "VIEWER"],
          default: "DEVELOPER",
        },
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
        message: "{VALUE} is not a valid status",
      },
      default: "PLANNING",
    },
    deadline: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    // Virtual fields are included when converting to JSON
    // This lets us add computed properties like memberCount
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual Field ────────────────────────────────────────────
// memberCount is computed on the fly — not stored in DB
// Saves storage and always stays accurate
projectSchema.virtual("memberCount").get(function () {
  return this.members?.length || 0;
});

// ─── Index ────────────────────────────────────────────────────
// Speeds up queries that filter projects by creator
projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;