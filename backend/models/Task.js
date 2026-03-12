const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Task must belong to a project"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // A task can exist without being assigned
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
        message: "{VALUE} is not a valid status",
      },
      default: "TODO",
    },
    priority: {
      type: String,
      enum: {
        values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        message: "{VALUE} is not a valid priority",
      },
      default: "MEDIUM",
    },
    deadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
// Most common query patterns get indexes for performance
taskSchema.index({ projectId: 1 });           // "Get all tasks for project X"
taskSchema.index({ assignedTo: 1 });          // "Get all tasks assigned to user X"
taskSchema.index({ projectId: 1, status: 1 }); // "Get TODO tasks in project X"

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;