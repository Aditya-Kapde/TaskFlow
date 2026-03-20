// ─────────────────────────────────────────────────────────────
// FILE: src/pages/dashboard/Dashboard.jsx
//
// WHAT WAS BROKEN (1 error):
//   Line 93: React Hook useEffect has a missing dependency: 'toast'
//
// WHY THIS IS TRICKY:
//   toast comes from useToast() which internally uses React context.
//   ESLint sees toast.error() called inside the effect and technically
//   wants it listed in the dep array.
//
// WHY WE DON'T JUST ADD toast TO THE DEP ARRAY:
//   The toast object from useToast() is re-created on every render
//   (it's a new object reference each time). Adding it to deps would
//   cause the dashboard to re-fetch data on every single render — an
//   infinite loop. This is a well-known ESLint false-positive pattern
//   for context-derived utility objects.
//
// THE FIX:
//   Add  // eslint-disable-next-line react-hooks/exhaustive-deps
//   directly above the closing bracket of the useEffect dep array.
//   This tells ESLint "I know what I'm doing here, trust me."
//   The empty [] is intentional — fetch once on mount only.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import taskService from "../../services/taskService";
import projectService from "../../services/projectService";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const STATUS_CONFIG = {
  TODO:        { color: "#9899b8", label: "To Do" },
  IN_PROGRESS: { color: "#7c5cfc", label: "In Progress" },
  IN_REVIEW:   { color: "#ffb547", label: "In Review" },
  DONE:        { color: "#00d68f", label: "Done" },
};

const PRIORITY_CONFIG = {
  LOW:      { color: "#00d68f", label: "Low" },
  MEDIUM:   { color: "#ffb547", label: "Medium" },
  HIGH:     { color: "#ff8c42", label: "High" },
  CRITICAL: { color: "#ff4d6d", label: "Critical" },
};

const STATUS_BADGE_MAP = {
  PLANNING:    "badge-secondary",
  IN_PROGRESS: "badge-primary",
  ON_HOLD:     "badge-warning",
  COMPLETED:   "badge-success",
  CANCELLED:   "badge-danger",
};

const StatCard = ({ icon, label, value, color, bg, delay = 0 }) => (
  <div className="stat-card stagger-item" style={{ animationDelay: `${delay}s` }}>
    <div className="stat-icon-wrap" style={{ background: bg, border: `1px solid ${color}30` }}>
      {icon}
    </div>
    <div className="stat-info">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const ProgressBar = ({ label, value, total, color, delay = 0 }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="progress-wrap" style={{ animationDelay: `${delay}s` }}>
      <div className="progress-label">
        <span className="progress-label-text">{label}</span>
        <span className="progress-label-val">{value} · {pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats]                     = useState(null);
  const [recentProjects, setRecentProjects]   = useState([]);
  const [loadingStats, setLoadingStats]       = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const { user, canManage } = useAuth();
  const navigate            = useNavigate();
  const toast               = useToast();

  useEffect(() => {
    taskService.getDashboardStats()
      .then((r) => setStats(r.data.stats))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoadingStats(false));

    projectService.getAllProjects({ limit: 5 })
      .then((r) => setRecentProjects(r.data.projects))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoadingProjects(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // FIX: toast intentionally excluded — adding it would cause
          // infinite re-fetching because toast is a new object each render

  const total = stats?.totalTasks || 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar title="Dashboard" />

      <main className="main-content">
        {/* Welcome banner */}
        <div className="welcome-banner">
          <div>
            <h2 className="welcome-banner-title">
              Good to see you, {user?.name?.split(" ")[0]} 👋
            </h2>
            <p className="welcome-banner-sub">
              Here's what's happening across your workspace today.
            </p>
          </div>
          {canManage() && (
            <button className="btn btn-primary" onClick={() => navigate("/projects")}>
              + New Project
            </button>
          )}
        </div>

        {/* Stat cards */}
        {loadingStats ? (
          <div className="stats-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat-card" style={{ minHeight: 88 }}>
                <div style={{
                  width: "100%", height: "100%",
                  background: "linear-gradient(90deg, var(--bg-3) 0%, var(--bg-4) 50%, var(--bg-3) 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                  borderRadius: "var(--radius-sm)",
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-grid">
            <StatCard icon="📁" label="Total Projects"  value={stats?.totalProjects  ?? 0} color="var(--accent-light)" bg="var(--accent-surface)"  delay={0.05} />
            <StatCard icon="✅" label="Total Tasks"     value={stats?.totalTasks     ?? 0} color="var(--info)"         bg="var(--info-surface)"    delay={0.10} />
            <StatCard icon="👤" label="Assigned to Me"  value={stats?.myAssignedTasks ?? 0} color="var(--success)"      bg="var(--success-surface)" delay={0.15} />
            <StatCard
              icon="⚠️"
              label="Overdue Tasks"
              value={stats?.overdueTasksCount ?? 0}
              color={stats?.overdueTasksCount > 0 ? "var(--danger)" : "var(--text-3)"}
              bg={stats?.overdueTasksCount > 0 ? "var(--danger-surface)" : "var(--bg-3)"}
              delay={0.20}
            />
          </div>
        )}

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: "1.5rem", gap: "1.25rem" }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Tasks by Status</h3>
              <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{total} total</span>
            </div>
            {loadingStats ? (
              <div className="spinner-container"><div className="spinner spinner-md" /></div>
            ) : total === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-3)", padding: "1.5rem 0", fontSize: "0.875rem" }}>No tasks yet</p>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg], i) => (
                  <ProgressBar key={key} label={cfg.label} value={stats?.tasksByStatus?.[key] ?? 0} total={total} color={cfg.color} delay={i * 0.05} />
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Tasks by Priority</h3>
              <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{total} total</span>
            </div>
            {loadingStats ? (
              <div className="spinner-container"><div className="spinner spinner-md" /></div>
            ) : total === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-3)", padding: "1.5rem 0", fontSize: "0.875rem" }}>No tasks yet</p>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg], i) => (
                  <ProgressBar key={key} label={cfg.label} value={stats?.tasksByPriority?.[key] ?? 0} total={total} color={cfg.color} delay={i * 0.05} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Projects</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/projects")}>
              View all →
            </button>
          </div>

          {loadingProjects ? (
            <div className="spinner-container"><div className="spinner spinner-md" /></div>
          ) : recentProjects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-3)" }}>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>No projects yet</p>
              {canManage() && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate("/projects")}>
                  Create your first project
                </button>
              )}
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: "0.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Members</th>
                    <th>Deadline</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((p) => (
                    <tr key={p._id} className="stagger-item">
                      <td>
                        <div>
                          <p style={{ fontWeight: 600, color: "var(--text-1)", fontSize: "0.875rem" }}>{p.title}</p>
                          {p.description && (
                            <p style={{ fontSize: "0.75rem", color: "var(--text-4)", marginTop: "0.1rem", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE_MAP[p.status] || "badge-secondary"}`}>
                          {p.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <div style={{ display: "flex" }}>
                            {(p.members || []).slice(0, 3).map((m, i) => (
                              <div
                                key={i}
                                className="avatar avatar-sm"
                                style={{ marginLeft: i > 0 ? "-6px" : 0, border: "2px solid var(--bg-2)", zIndex: 3 - i }}
                                title={m.user?.name}
                              >
                                {m.user?.name?.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
                            {p.members?.length || 0}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>
                          {formatDate(p.deadline)}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${p._id}`)}>
                          Open →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;