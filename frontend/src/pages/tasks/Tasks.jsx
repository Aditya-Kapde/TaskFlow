// ─────────────────────────────────────────────────────────────
// FILE: src/pages/tasks/Tasks.jsx
//
// WHAT WAS BROKEN (2 errors):
//
//   ERROR 1 — Line 13:
//     'formatDate' is defined but never used (no-unused-vars)
//     formatDate was imported from helpers but never actually called
//     in this file's JSX. The task detail panel in this page shows
//     raw values — formatDate was used in the selectedTask panel
//     via TaskCard which handles its own formatting. Fix: remove
//     formatDate from the import line.
//
//   ERROR 2 — Line 59:
//     React Hook useCallback has a missing dependency: 'toast'
//     Same pattern as Dashboard and Projects. toast.error() is called
//     inside the callback so ESLint flags toast as a missing dep.
//     Adding toast would cause the callback to be recreated every
//     render, triggering useEffect infinitely.
//     Fix: eslint-disable-next-line on the dep array closing line.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import TaskCard from "../../components/tasks/TaskCard";
import TaskForm from "../../components/tasks/TaskForm";
import CommentSection from "../../components/comments/CommentSection";
import EmptyState from "../../components/common/EmptyState";
import Spinner from "../../components/common/Spinner";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import taskService from "../../services/taskService";
import projectService from "../../services/projectService";
// FIX 1: Removed 'formatDate' from this import — it was imported
// but never called anywhere in this file, triggering no-unused-vars.
import { getErrorMessage } from "../../utils/helpers";

const PRIORITY_COLORS = {
  LOW: "#00d68f", MEDIUM: "#ffb547", HIGH: "#ff8c42", CRITICAL: "#ff4d6d",
};

const Tasks = () => {
  const [tasks, setTasks]           = useState([]);
  const [projects, setProjects]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [pagination, setPagination] = useState(null);

  const [searchTerm, setSearchTerm]         = useState("");
  const [statusFilter, setStatusFilter]     = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [projectFilter, setProjectFilter]   = useState("ALL");
  const [currentPage, setCurrentPage]       = useState(1);

  const [showCreate, setShowCreate]     = useState(false);
  const [editingTask, setEditingTask]   = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  const { canManage } = useAuth();
  const toast         = useToast();

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page:  currentPage,
        limit: 12,
        ...(searchTerm                 && { search:    searchTerm }),
        ...(statusFilter   !== "ALL"   && { status:    statusFilter }),
        ...(priorityFilter !== "ALL"   && { priority:  priorityFilter }),
        ...(projectFilter  !== "ALL"   && { projectId: projectFilter }),
      };
      const res = await taskService.getAllTasks(params);
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, statusFilter, priorityFilter, projectFilter]);
  // FIX 2: toast intentionally omitted — adding it would cause
  // infinite re-fetching since toast is a new object each render.

  useEffect(() => {
    projectService.getAllProjects({ limit: 100 })
      .then((r) => setProjects(r.data.projects))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, priorityFilter, projectFilter]);

  const handleConfirmDelete = async () => {
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

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar title="Tasks" />

      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Tasks</h1>
            <p style={{ color: "var(--text-3)", fontSize: "0.875rem", marginTop: "0.2rem" }}>
              {pagination ? `${pagination.total} task${pagination.total !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          {canManage() && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Task</button>
          )}
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 140 }}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 130 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["ALL","TODO","IN_PROGRESS","IN_REVIEW","DONE"].map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace("_", " ")}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 130 }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            {["ALL","LOW","MEDIUM","HIGH","CRITICAL"].map((p) => (
              <option key={p} value={p}>{p === "ALL" ? "All Priorities" : p}</option>
            ))}
          </select>
        </div>

        {/* Two-panel layout */}
        <div style={{ display: "grid", gridTemplateColumns: selectedTask ? "1fr 400px" : "1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* Task grid */}
          <div>
            {isLoading ? (
              <Spinner size="large" />
            ) : tasks.length === 0 ? (
              <EmptyState
                icon="✅"
                title="No tasks found"
                message={
                  searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL" || projectFilter !== "ALL"
                    ? "Try adjusting your filters."
                    : "No tasks have been created yet."
                }
                action={canManage() && (
                  <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    Create First Task
                  </button>
                )}
              />
            ) : (
              <>
                <div className="grid-3">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTask((p) => p?._id === task._id ? null : task)}
                      style={{
                        outline: selectedTask?._id === task._id ? "2px solid var(--accent)" : "none",
                        borderRadius: "var(--radius)",
                        cursor: "pointer",
                      }}
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

                {pagination?.totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem", marginTop: "2rem" }}>
                    <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} className={`btn btn-sm ${p === currentPage ? "btn-primary" : "btn-secondary"}`} onClick={() => setCurrentPage(p)}>{p}</button>
                    ))}
                    <button className="btn btn-secondary btn-sm" disabled={currentPage === pagination.totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detail + comment panel */}
          {selectedTask && (
            <div className="card detail-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.1rem" }}>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.95rem", flex: 1, paddingRight: "0.5rem", lineHeight: 1.35 }}>
                  {selectedTask.title}
                </h3>
                <button className="modal-close" onClick={() => setSelectedTask(null)}>×</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", fontSize: "0.82rem", marginBottom: "1.1rem" }}>
                {[
                  { label: "Project",  value: selectedTask.projectId?.title || "—" },
                  { label: "Assigned", value: selectedTask.assignedTo?.name || "Unassigned" },
                  { label: "Status",   value: selectedTask.status?.replace("_", " ") },
                  { label: "Created",  value: selectedTask.createdBy?.name },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.55rem", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-3)", fontWeight: 500 }}>{label}</span>
                    <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.55rem", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-3)", fontWeight: 500 }}>Priority</span>
                  <span style={{ color: PRIORITY_COLORS[selectedTask.priority], fontWeight: 700 }}>
                    {selectedTask.priority}
                  </span>
                </div>
                {selectedTask.description && (
                  <div>
                    <p style={{ color: "var(--text-3)", fontWeight: 500, marginBottom: "0.3rem" }}>Description</p>
                    <p style={{ color: "var(--text-2)", lineHeight: 1.65 }}>{selectedTask.description}</p>
                  </div>
                )}
              </div>

              {canManage() && (
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.1rem" }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setEditingTask(selectedTask); setSelectedTask(null); }}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => { setDeletingTask(selectedTask); setSelectedTask(null); }}>
                    🗑️ Delete
                  </button>
                </div>
              )}

              <h4 style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-2)", marginBottom: "0.85rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                💬 Comments
              </h4>
              <CommentSection taskId={selectedTask._id} />
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <TaskForm onSuccess={() => { setShowCreate(false); fetchTasks(); }} onClose={() => setShowCreate(false)} />
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
              Deleting <strong style={{ color: "var(--text-1)" }}>{deletingTask.title}</strong> will remove all its comments.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingTask(null)} disabled={isDeleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;