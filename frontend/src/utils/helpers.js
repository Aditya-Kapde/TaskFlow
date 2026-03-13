// ─── Format date for display ───────────────────────────────────
export const formatDate = (date) => {
  if (!date) return "No deadline";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ─── Check if a deadline has passed ───────────────────────────
export const isOverdue = (deadline, status) => {
  if (!deadline || status === "DONE") return false;
  return new Date(deadline) < new Date();
};

// ─── Map status to a display color class ──────────────────────
export const getStatusColor = (status) => {
  const colors = {
    TODO: "badge-secondary",
    IN_PROGRESS: "badge-primary",
    IN_REVIEW: "badge-warning",
    DONE: "badge-success",
    PLANNING: "badge-secondary",
    ON_HOLD: "badge-warning",
    COMPLETED: "badge-success",
    CANCELLED: "badge-danger",
  };
  return colors[status] || "badge-secondary";
};

// ─── Map priority to a display color class ────────────────────
export const getPriorityColor = (priority) => {
  const colors = {
    LOW: "priority-low",
    MEDIUM: "priority-medium",
    HIGH: "priority-high",
    CRITICAL: "priority-critical",
  };
  return colors[priority] || "priority-medium";
};

// ─── Get user initials for avatar display ─────────────────────
export const getUserInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ─── Extract error message from axios error ───────────────────
// Handles the different shapes an API error can take
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.errors?.length > 0) {
    return error.response.data.errors
      .map((e) => e.message)
      .join(", ");
  }
  if (error?.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};

// ─── Capitalize first letter of a string ─────────────────────
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};