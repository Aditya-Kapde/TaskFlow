// ─────────────────────────────────────────────────────────────
// FILE: src/pages/projects/Projects.jsx
//
// WHAT WAS BROKEN (2 errors):
//
//   ERROR 1 — Line 29:
//     'isAdmin' is assigned a value but never used (no-unused-vars)
//     isAdmin was destructured from useAuth() but never called
//     anywhere in this component's JSX or logic. It was a leftover
//     from an earlier version. Fix: simply remove it from the
//     destructure.
//
//   ERROR 2 — Line 49:
//     React Hook useCallback has a missing dependency: 'toast'
//     Same pattern as Dashboard. toast from useToast() is technically
//     used inside the callback (toast.error) so ESLint flags it.
//     Adding it would cause the callback — and therefore useEffect —
//     to re-run on every render, causing infinite fetching.
//     Fix: eslint-disable-next-line on the dependency array line.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import ProjectCard from "../../components/projects/ProjectCard";
import ProjectForm from "../../components/projects/ProjectForm";
import EmptyState from "../../components/common/EmptyState";
import Spinner from "../../components/common/Spinner";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import projectService from "../../services/projectService";
import { getErrorMessage } from "../../utils/helpers";

const STATUS_FILTERS = ["ALL", "PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];

const Projects = () => {
  const [projects, setProjects]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [pagination, setPagination] = useState(null);

  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage]   = useState(1);

  const [showCreate, setShowCreate]           = useState(false);
  const [editingProject, setEditingProject]   = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [isDeleting, setIsDeleting]           = useState(false);

  // FIX 1: Removed 'isAdmin' from the destructure — it was never
  // used anywhere in this file. Keeping unused variables is an error
  // in CI environments.
  const { canManage } = useAuth();
  const toast = useToast();

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page:  currentPage,
        limit: 9,
        ...(searchTerm             && { search: searchTerm }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      };
      const res = await projectService.getAllProjects(params);
      setProjects(res.data.projects);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, statusFilter]); // FIX 2: toast omitted intentionally

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const handleDelete = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    try {
      await projectService.deleteProject(deletingProject._id);
      toast.success("Project deleted");
      setDeletingProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar title="Projects" />

      <main className="main-content">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p style={{ color: "var(--text-3)", fontSize: "0.875rem", marginTop: "0.2rem" }}>
              {pagination ? `${pagination.total} project${pagination.total !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          {canManage() && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New Project
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search projects…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "ALL" ? "All" : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Spinner size="large" />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No projects found"
            message={
              searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your filters."
                : "No projects have been created yet."
            }
            action={
              canManage() ? (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  Create First Project
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="grid-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onEdit={setEditingProject}
                  onDelete={setDeletingProject}
                />
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
      </main>

      {showCreate && (
        <ProjectForm
          onSuccess={() => { setShowCreate(false); fetchProjects(); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingProject && (
        <ProjectForm
          project={editingProject}
          onSuccess={() => { setEditingProject(null); fetchProjects(); }}
          onClose={() => setEditingProject(null)}
        />
      )}

      {deletingProject && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Project</h2>
              <button className="modal-close" onClick={() => setDeletingProject(null)}>×</button>
            </div>
            <div>
              <div style={{ background: "var(--danger-surface)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: "var(--radius-sm)", padding: "0.9rem", marginBottom: "1rem" }}>
                <p style={{ color: "var(--danger)", fontWeight: 600, fontSize: "0.875rem" }}>⚠️ This cannot be undone</p>
              </div>
              <p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
                Deleting <strong style={{ color: "var(--text-1)" }}>{deletingProject.title}</strong> will permanently remove all its tasks and comments.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingProject(null)} disabled={isDeleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;