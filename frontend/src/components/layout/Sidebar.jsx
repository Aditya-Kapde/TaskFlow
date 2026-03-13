import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getUserInitials } from "../../utils/helpers";

const NAV_ITEMS = [
  {
    path:  "/dashboard",
    label: "Dashboard",
    icon:  "📊",
    roles: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "VIEWER"],
  },
  {
    path:  "/projects",
    label: "Projects",
    icon:  "📁",
    roles: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "VIEWER"],
  },
  {
    path:  "/tasks",
    label: "My Tasks",
    icon:  "✅",
    roles: ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "VIEWER"],
  },
];

const ROLE_COLORS = {
  ADMIN:           "#ffb547",
  PROJECT_MANAGER: "#7c5cfc",
  DEVELOPER:       "#4cc9f0",
  VIEWER:          "#00d68f",
};

const Sidebar = () => {
  const { user } = useAuth();
  const visible  = NAV_ITEMS.filter((n) => n.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      {/* ── Logo ────────────────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-inner">
          <div className="sidebar-logo-icon">⚡</div>
          <div>
            <h1>PMS</h1>
            <p>Project Management</p>
          </div>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <p className="sidebar-section-label">Navigation</p>
        <nav className="sidebar-nav">
          {visible.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-link-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="nav-link-dot" />
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Footer: user info ────────────────────────────────── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar avatar-sm">
            {getUserInitials(user?.name)}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <p
              className="sidebar-user-role"
              style={{ color: ROLE_COLORS[user?.role] || "var(--accent-light)" }}
            >
              {user?.role?.replace("_", " ")}
            </p>
          </div>
          <div className="pulse-dot" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;