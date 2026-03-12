const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Comment must belong to a task"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment must have an author"],
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true, // createdAt serves as the comment timestamp
  }
);

// ─── Index ────────────────────────────────────────────────────
// Primary query is always "get all comments for task X"
commentSchema.index({ taskId: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;