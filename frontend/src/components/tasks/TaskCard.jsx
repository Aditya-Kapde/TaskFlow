import { useState } from "react";
import taskService from "../../services/taskService";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { formatDate, isOverdue, getErrorMessage } from "../../utils/helpers";

const PRIORITY_COLORS = {
  LOW:      { color: "#00d68f", bg: "rgba(0,214,143,0.1)" },
  MEDIUM:   { color: "#ffb547", bg: "rgba(255,181,71,0.1)" },
  HIGH:     { color: "#ff8c42", bg: "rgba(255,140,66,0.1)" },
  CRITICAL: { color: "#ff4d6d", bg: "rgba(255,77,109,0.1)" },
};

const STATUS_CONFIG = {
  TODO:        { badge: "badge-secondary", label: "To Do" },
  IN_PROGRESS: { badge: "badge-primary",   label: "In Progress" },
  IN_REVIEW:   { badge: "badge-warning",   label: "In Review" },
  DONE:        { badge: "badge-success",   label: "Done" },
};

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [expanded, setExpanded]     = useState(false);

  const { canManage, isDeveloper, user } = useAuth();
  const toast = useToast();

  const pc           = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
  const sc           = STATUS_CONFIG[task.status]     || STATUS_CONFIG.TODO;
  const overdue      = isOverdue(task.deadline, task.status);
  const isAssignedToMe = task.assignedTo?._id === user?.id || task.assignedTo === user?.id;
  const canUpdateStatus = canManage() || (isDeveloper() && isAssignedToMe);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === task.status) return;
    setIsUpdating(true);
    try {
      await taskService.updateTaskStatus(task._id, newStatus);
      toast.success(`Moved to ${newStatus.replace("_", " ")}`);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="task-card"
      style={{
        borderLeft: `3px solid ${pc.color}`,
        opacity: task.status === "DONE" ? 0.65 : 1,
      }}
      onClick={() => setExpanded((p) => !p)}
    >
      {/* Header */}
      <div className="task-card-header">
        <h4
          className="task-title"
          style={{ textDecoration: task.status === "DONE" ? "line-through" : "none" }}
        >
          {task.title}
        </h4>

        {/* Status badge/selector */}
        <div onClick={(e) => e.stopPropagation()}>
          {canUpdateStatus ? (
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-4)",
                border: "1px solid var(--border-bright)",
                borderRadius: "99px",
                color: "var(--text-2)",
                fontSize: "0.68rem",
                fontWeight: 600,
                padding: "0.18rem 0.9rem 0.18rem 0.5rem",
                cursor: "pointer",
                outline: "none",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                appearance: "none",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%239899b8' d='M5 7L1 3h8z'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.35rem center",
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          ) : (
            <span className={`badge ${sc.badge}`}>{sc.label}</span>
          )}
        </div>
      </div>

      {/* Priority pill */}
      <div style={{ marginBottom: "0.65rem" }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.12rem 0.55rem",
          borderRadius: "99px",
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: pc.color,
          background: pc.bg,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: pc.color, display: "inline-block" }} />
          {task.priority}
        </span>
      </div>

      {/* Meta */}
      <div className="task-meta">
        <div className="task-meta-row">
          <span>📁</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
            {task.projectId?.title || "—"}
          </span>
        </div>

        <div className="task-meta-row">
          <span>👤</span>
          <span>
            {task.assignedTo?.name
              ? <>
                  {task.assignedTo.name}
                  {isAssignedToMe && <span style={{ color: "var(--accent-light)", fontWeight: 600, marginLeft: "0.25rem" }}>(you)</span>}
                </>
              : <em style={{ color: "var(--text-4)" }}>Unassigned</em>
            }
          </span>
        </div>

        <div className="task-meta-row" style={{ color: overdue ? "var(--danger)" : undefined }}>
          <span>📅</span>
          <span>
            {formatDate(task.deadline)}
            {overdue && <span style={{ marginLeft: "0.3rem", fontSize: "0.7rem" }}>⚠ Overdue</span>}
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "0.85rem" }}>
          <div className="divider" />
          {task.description && (
            <p style={{ fontSize: "0.84rem", color: "var(--text-3)", lineHeight: 1.65, marginBottom: "0.75rem" }}>
              {task.description}
            </p>
          )}
          <p style={{ fontSize: "0.75rem", color: "var(--text-4)", marginBottom: "0.75rem" }}>
            Created by <strong style={{ color: "var(--text-3)" }}>{task.createdBy?.name || "—"}</strong>
          </p>
          {canManage() && (
            <div style={{ display: "flex", gap: "0.45rem" }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onEdit(task)}>✏️ Edit</button>
              <button className="btn btn-danger btn-sm"    style={{ flex: 1 }} onClick={() => onDelete(task)}>🗑️ Delete</button>
            </div>
          )}
        </div>
      )}

      {/* Expand hint */}
      <div style={{ textAlign: "center", marginTop: "0.55rem", fontSize: "0.68rem", color: "var(--text-4)" }}>
        {expanded ? "▲ less" : "▼ more"}
      </div>
    </div>
  );
};

export default TaskCard;