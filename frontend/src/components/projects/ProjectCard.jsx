import { useNavigate } from "react-router-dom";
import { formatDate, isOverdue } from "../../utils/helpers";
import useAuth from "../../hooks/useAuth";

const STATUS_CONFIG = {
  PLANNING:    { badge: "badge-secondary", dot: "#9899b8" },
  IN_PROGRESS: { badge: "badge-primary",   dot: "#7c5cfc" },
  ON_HOLD:     { badge: "badge-warning",   dot: "#ffb547" },
  COMPLETED:   { badge: "badge-success",   dot: "#00d68f" },
  CANCELLED:   { badge: "badge-danger",    dot: "#ff4d6d" },
};

const ProjectCard = ({ project, onEdit, onDelete }) => {
  const navigate             = useNavigate();
  const { isAdmin, canManage } = useAuth();

  const overdue = isOverdue(project.deadline, project.status);
  const cfg     = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNING;

  return (
    <div
      className="project-card stagger-item"
      style={{
        borderLeft: overdue
          ? "3px solid var(--danger)"
          : `3px solid ${cfg.dot}`,
      }}
      onClick={() => navigate(`/projects/${project._id}`)}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.6rem" }}>
        <h3 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "0.95rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          flex: 1,
          lineHeight: 1.35,
          color: "var(--text-1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {project.title}
        </h3>
        <span className={`badge ${cfg.badge}`} style={{ flexShrink: 0 }}>
          {project.status?.replace("_", " ")}
        </span>
      </div>

      {/* ── Description ─────────────────────────────────────── */}
      {project.description && (
        <p style={{
          fontSize: "0.82rem",
          color: "var(--text-3)",
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {project.description}
        </p>
      )}

      {/* ── Meta ────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.78rem",
        color: "var(--text-3)",
        paddingTop: "0.5rem",
        borderTop: "1px solid var(--border)",
      }}>
        {/* Member avatars */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex" }}>
            {(project.members || []).slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="avatar avatar-sm"
                style={{ marginLeft: i > 0 ? "-5px" : 0, border: "2px solid var(--bg-2)", zIndex: 4 - i }}
                title={m.user?.name}
              >
                {m.user?.name?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span>
            {project.members?.length || 0} member{project.members?.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Deadline */}
        <span style={{ color: overdue ? "var(--danger)" : "var(--text-3)" }}>
          📅 {formatDate(project.deadline)}
          {overdue && " ⚠"}
        </span>
      </div>

      {/* ── Creator ─────────────────────────────────────────── */}
      <p style={{ fontSize: "0.73rem", color: "var(--text-4)" }}>
        by{" "}
        <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
          {project.createdBy?.name || "Unknown"}
        </span>
      </p>

      {/* ── Actions ─────────────────────────────────────────── */}
      {canManage() && (
        <div
          style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
            onClick={() => onEdit(project)}
          >
            ✏️ Edit
          </button>
          {isAdmin() && (
            <button
              className="btn btn-danger btn-sm"
              style={{ flex: 1 }}
              onClick={() => onDelete(project)}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;