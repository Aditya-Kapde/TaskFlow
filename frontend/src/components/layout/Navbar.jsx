import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { getUserInitials } from "../../utils/helpers";

const ROLE_BADGES = {
  ADMIN:           { color: "#ffb547", bg: "rgba(255,181,71,0.1)",   border: "rgba(255,181,71,0.25)" },
  PROJECT_MANAGER: { color: "#7c5cfc", bg: "rgba(124,92,252,0.1)",   border: "rgba(124,92,252,0.25)" },
  DEVELOPER:       { color: "#4cc9f0", bg: "rgba(76,201,240,0.1)",   border: "rgba(76,201,240,0.25)" },
  VIEWER:          { color: "#00d68f", bg: "rgba(0,214,143,0.1)",    border: "rgba(0,214,143,0.25)"  },
};

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const toast            = useToast();
  const roleBadge        = ROLE_BADGES[user?.role] || ROLE_BADGES.VIEWER;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <nav className="navbar">
      {/* ── Left: page title ──────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <h2 className="navbar-title">{title}</h2>
      </div>

      {/* ── Right: role badge + avatar + logout ───────────── */}
      <div className="navbar-right">
        {/* Role badge */}
        <span
          style={{
            padding: "0.25rem 0.7rem",
            borderRadius: "99px",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: roleBadge.color,
            background: roleBadge.bg,
            border: `1px solid ${roleBadge.border}`,
          }}
        >
          {user?.role?.replace("_", " ")}
        </span>

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <div className="avatar avatar-md">
            {getUserInitials(user?.name)}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>
              {user?.name}
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>
              {user?.email}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleLogout}
          style={{ gap: "0.35rem" }}
        >
          <span>↪</span>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;