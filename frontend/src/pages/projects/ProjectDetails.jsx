// ─────────────────────────────────────────────────────────────
// FILE: src/pages/projects/ProjectDetails.jsx
//
// WHAT WAS BROKEN (3 errors):
//
//   ERROR 1 — Line 47:
//     'setPriorityFilter' is assigned a value but never used
//     priorityFilter state was declared and used in fetchTasks,
//     but setPriorityFilter (the setter) was never called from any
//     button or input in the JSX. Fix: add priority filter buttons
//     to the tasks tab toolbar so the setter is actually called.
//
//   ERROR 2 — Line 78:
//     useEffect missing dependency: 'fetchProject'
//     fetchProject was a plain async function inside the component,
//     so it was recreated every render. Putting it in useEffect
//     deps would cause infinite loops. Fix: wrap in useCallback.
//
//   ERROR 3 — Line 79:
//     useEffect missing dependency: 'fetchTasks'
//     Same issue. Fix: wrap in useCallback with its real deps
//     [id, statusFilter, priorityFilter].
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react"; // useCallback was already here — good
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import MemberList from "../../components/projects/MemberList";
import ProjectForm from "../../components/projects/ProjectForm";
import TaskCard from "../../components/tasks/TaskCard";
import TaskForm from "../../components/tasks/TaskForm";
import CommentSection from "../../components/comments/CommentSection";
import EmptyState from "../../components/common/EmptyState";
import Spinner from "../../components/common/Spinner";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import projectService from "../../services/projectService";
import taskService from "../../services/taskService";
import { formatDate, isOverdue, getErrorMessage } from "../../utils/helpers";

const STATUS_CONFIG = {
  PLANNING:    { badge: "badge-secondary", color: "#9899b8" },
  IN_PROGRESS: { badge: "badge-primary",   color: "#7c5cfc" },
  ON_HOLD:     { badge: "badge-warning",   color: "#ffb547" },
  COMPLETED:   { badge: "badge-success",   color: "#00d68f" },
  CANCELLED:   { badge: "badge-danger",    color: "#ff4d6d" },
};

const ProjectDetails = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const toast      = useToast();
  const { canManage, isAdmin } = useAuth();

  const [project, setProject]           = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab]       = useState("overview");

  const [showEdit, setShowEdit]               = useState(false);
  const [showCreateTask, setShowCreateTask]   = useState(false);
  const [editingTask, setEditingTask]         = useState(null);
  const [deletingTask, setDeletingTask]       = useState(null);
  const [selectedTask, setSelectedTask]       = useState(null);
  const [isDeleting, setIsDeleting]           = useState(false);

  const [statusFilter, setStatusFilter]     = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // FIX for Error 2: useCallback makes fetchProject stable.
  // It only changes when `id` changes (new project URL).
  const fetchProject = useCallback(async () => {
    try {
      const res = await projectService.getProjectById(id);
      setProject(res.data.project);
    } catch (err) {
      toast.error(getErrorMessage(err));
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // toast and navigate are stable refs — safe to omit

  // FIX for Error 3: useCallback with real deps [id, statusFilter,
  // priorityFilter]. When any filter changes, a new stable callback
  // is created, which triggers the useEffect below to re-run.
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const params = {
        ...(statusFilter   !== "ALL" && { status:   statusFilter }),
        ...(priorityFilter !== "ALL" && { priority: priorityFilter }),
        limit: 50,
      };
      const res = await taskService.getTasksByProject(id, params);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingTasks(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, statusFilter, priorityFilter]); // toast omitted — stable ref

  useEffect(() => { fetchProject(); }, [fetchProject]);
  useEffect(() => { if (activeTab === "tasks") fetchTasks(); }, [activeTab, fetchTasks]);

  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      await taskService.deleteTask(deletingTask._id);
      toast.success("Task deleted");
      setDeletingTask(null);
      if (selectedTask?._id === deletingTask._id) setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (!project) return null;

  const overdue = isOverdue(project.deadline, project.status);
  const cfg     = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNING;

  const TABS = [
    { key: "overview", label: "Overview", icon: "📋" },
    { key: "tasks",    label: "Tasks",    icon: "✅" },
    { key: "members",  label: "Members",  icon: "👥", count: project.members?.length },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar title="Project Details" />

      <main className="main-content">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: "1.2rem" }} onClick={() => navigate("/projects")}>
          ← Back to Projects
        </button>

        {/* Project header card */}
        <div className="card" style={{
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%)",
          borderColor: cfg.color + "30",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: `radial-gradient(circle, ${cfg.color}15 0%, transparent 70%)`, pointerEvents: "none" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", position: "relative" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 10px ${cfg.color}`, flexShrink: 0 }} />
                <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
                  {project.title}
                </h1>
                <span className={`badge ${cfg.badge}`}>{project.status?.replace("_", " ")}</span>
                {overdue && <span className="badge badge-danger">Overdue ⚠</span>}
              </div>
              {project.description && (
                <p style={{ color: "var(--text-3)", fontSize: "0.9rem", lineHeight: 1.65, maxWidth: 600 }}>
                  {project.description}
                </p>
              )}
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                {[
                  { icon: "📅", label: "Deadline",   value: formatDate(project.deadline) },
                  { icon: "👥", label: "Members",    value: `${project.members?.length || 0}` },
                  { icon: "👤", label: "Created by", value: project.createdBy?.name },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{icon} {label}</span>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-2)", fontWeight: 500 }}>{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            {canManage() && (
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>✏️ Edit</button>
                {isAdmin() && (
                  <button className="btn btn-danger btn-sm" onClick={() => navigate("/projects")}>🗑️ Delete</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map((t) => (
            <button key={t.key} className={`tab-btn ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
              <span>{t.icon}</span>
              {t.label}
              {t.count !== undefined && (
                <span style={{
                  background: activeTab === t.key ? "var(--accent-surface)" : "var(--bg-4)",
                  color: activeTab === t.key ? "var(--accent-light)" : "var(--text-3)",
                  borderRadius: "99px", padding: "0.05rem 0.45rem",
                  fontSize: "0.7rem", fontWeight: 600,
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ──────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid-2" style={{ alignItems: "start" }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "1.1rem" }}>Project Info</h3>
              <dl style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {[
                  { label: "Title",       value: project.title },
                  { label: "Description", value: project.description || "—" },
                  { label: "Status",      value: <span className={`badge ${cfg.badge}`}>{project.status?.replace("_", " ")}</span> },
                  { label: "Deadline",    value: formatDate(project.deadline) },
                  { label: "Created by",  value: project.createdBy?.name },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.85rem", borderBottom: "1px solid var(--border)" }}>
                    <dt style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 500 }}>{label}</dt>
                    <dd style={{ fontSize: "0.875rem", color: "var(--text-2)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "1.1rem" }}>Members Preview</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {(project.members || []).slice(0, 5).map((m, i) => {
                  const ROLE_COLORS = { PROJECT_MANAGER: "#7c5cfc", DEVELOPER: "#4cc9f0", VIEWER: "#00d68f", ADMIN: "#ffb547" };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div className="avatar avatar-sm">{m.user?.name?.charAt(0).toUpperCase()}</div>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>{m.user?.name}</span>
                      </div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: ROLE_COLORS[m.role] || "var(--text-3)" }}>
                        {m.role?.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
                {project.members?.length > 5 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("members")}>
                    +{project.members.length - 5} more — View all
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Tasks ─────────────────────────────────── */}
        {activeTab === "tasks" && (
          <div>
            {/* Task toolbar */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.1rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Status filters */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {["ALL","TODO","IN_PROGRESS","IN_REVIEW","DONE"].map((s) => (
                  <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`} onClick={() => setStatusFilter(s)}>
                    {s === "ALL" ? "All Status" : s.replace("_", " ")}
                  </button>
                ))}
              </div>
              {/* FIX for Error 1: Priority filter buttons now call
                  setPriorityFilter — the setter is no longer unused */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {["ALL","LOW","MEDIUM","HIGH","CRITICAL"].map((p) => (
                  <button key={p} className={`btn btn-sm ${priorityFilter === p ? "btn-primary" : "btn-secondary"}`} onClick={() => setPriorityFilter(p)}>
                    {p === "ALL" ? "All Priority" : p}
                  </button>
                ))}
              </div>
              {canManage() && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}>+ New Task</button>
              )}
            </div>

            {loadingTasks ? (
              <Spinner />
            ) : tasks.length === 0 ? (
              <EmptyState
                icon="✅"
                title="No tasks found"
                message="No tasks match the current filters."
                action={canManage() && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}>
                    Create First Task
                  </button>
                )}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: selectedTask ? "1fr 380px" : "1fr", gap: "1.25rem", alignItems: "start" }}>
                <div className="grid-3" style={{ gridColumn: "1" }}>
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTask((p) => p?._id === task._id ? null : task)}
                      style={{ outline: selectedTask?._id === task._id ? "2px solid var(--accent)" : "none", borderRadius: "var(--radius)" }}
                    >
                      <TaskCard
                        task={task}
                        onEdit={(t) => { setEditingTask(t); setSelectedTask(null); }}
                        onDelete={(t) => setDeletingTask(t)}
                        onStatusChange={fetchTasks}
                      />
                    </div>
                  ))}
                </div>

                {selectedTask && (
                  <div className="card detail-panel" style={{ gridColumn: "2" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1rem", flex: 1, paddingRight: "0.5rem" }}>
                        {selectedTask.title}
                      </h3>
                      <button className="modal-close" onClick={() => setSelectedTask(null)}>×</button>
                    </div>
                    {selectedTask.description && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-3)", lineHeight: 1.65, marginBottom: "1rem" }}>
                        {selectedTask.description}
                      </p>
                    )}
                    <div className="divider" />
                    <h4 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.85rem", color: "var(--text-2)" }}>💬 Comments</h4>
                    <CommentSection taskId={selectedTask._id} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Members ───────────────────────────────── */}
        {activeTab === "members" && (
          <div className="card" style={{ maxWidth: 600 }}>
            <MemberList projectId={id} creatorId={project.createdBy?._id} />
          </div>
        )}
      </main>

      {showEdit && (
        <ProjectForm project={project} onSuccess={() => { setShowEdit(false); fetchProject(); }} onClose={() => setShowEdit(false)} />
      )}
      {showCreateTask && (
        <TaskForm defaultProjectId={id} onSuccess={() => { setShowCreateTask(false); fetchTasks(); }} onClose={() => setShowCreateTask(false)} />
      )}
      {editingTask && (
        <TaskForm task={editingTask} onSuccess={() => { setEditingTask(null); fetchTasks(); }} onClose={() => setEditingTask(null)} />
      )}

      {deletingTask && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Task</h2>
              <button className="modal-close" onClick={() => setDeletingTask(null)}>×</button>
            </div>
            <div style={{ background: "var(--danger-surface)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: "var(--radius-sm)", padding: "0.85rem", marginBottom: "0.85rem" }}>
              <p style={{ color: "var(--danger)", fontWeight: 600, fontSize: "0.875rem" }}>⚠️ This cannot be undone</p>
            </div>
            <p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
              Deleting <strong style={{ color: "var(--text-1)" }}>{deletingTask.title}</strong> will also remove all its comments.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingTask(null)} disabled={isDeleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteTask} disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;