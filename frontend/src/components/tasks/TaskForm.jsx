// ─────────────────────────────────────────────────────────────
// FILE: src/components/tasks/TaskForm.jsx
//
// WHAT WAS BROKEN (1 error):
//   Line 114: 'selectedPriority' is assigned a value but never used
//   (no-unused-vars)
//
// WHY IT ERRORS ON VERCEL:
//   ESLint's no-unused-vars rule forbids variables that are declared
//   but never read. Locally this shows as a warning. On Vercel (CI=true)
//   it becomes a hard error that stops the build.
//
// THE FIX:
//   Simply delete the line:
//     const selectedPriority = PRIORITIES.find(...)
//   It was a leftover from an earlier draft where we displayed a
//   preview of the selected priority color — that UI was later built
//   directly inline using formData.priority, making this variable
//   completely redundant.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import taskService from "../../services/taskService";
import projectService from "../../services/projectService";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/helpers";

const PRIORITIES = [
  { value: "LOW",      color: "#00d68f" },
  { value: "MEDIUM",   color: "#ffb547" },
  { value: "HIGH",     color: "#ff8c42" },
  { value: "CRITICAL", color: "#ff4d6d" },
];
const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

const TaskForm = ({ task, defaultProjectId, onSuccess, onClose }) => {
  const isEdit = !!task;

  const [formData, setFormData] = useState({
    title:       "",
    description: "",
    projectId:   defaultProjectId || "",
    assignedTo:  "",
    priority:    "MEDIUM",
    status:      "TODO",
    deadline:    "",
  });

  const [fieldErrors, setFieldErrors]           = useState({});
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [projects, setProjects]                 = useState([]);
  const [projectMembers, setProjectMembers]     = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (task) {
      setFormData({
        title:       task.title       || "",
        description: task.description || "",
        projectId:   task.projectId?._id || task.projectId || "",
        assignedTo:  task.assignedTo?._id || task.assignedTo || "",
        priority:    task.priority    || "MEDIUM",
        status:      task.status      || "TODO",
        deadline:    task.deadline
          ? new Date(task.deadline).toISOString().split("T")[0]
          : "",
      });
    }
  }, [task]);

  useEffect(() => {
    projectService.getAllProjects({ limit: 100 })
      .then((r) => setProjects(r.data.projects))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formData.projectId) { setProjectMembers([]); return; }
    setIsLoadingMembers(true);
    projectService.getProjectMembers(formData.projectId)
      .then((r) => setProjectMembers(r.data.members))
      .catch(() => setProjectMembers([]))
      .finally(() => setIsLoadingMembers(false));
  }, [formData.projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "projectId") {
      setFormData((p) => ({ ...p, projectId: value, assignedTo: "" }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim())               errors.title       = "Title is required";
    else if (formData.title.trim().length < 3) errors.title       = "At least 3 characters";
    if (!formData.projectId)                  errors.projectId   = "Select a project";
    if (formData.description.length > 1000)   errors.description = "Max 1000 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title:       formData.title.trim(),
        description: formData.description.trim(),
        projectId:   formData.projectId,
        priority:    formData.priority,
        status:      formData.status,
        ...(formData.assignedTo && { assignedTo: formData.assignedTo }),
        ...(formData.deadline   && { deadline:   formData.deadline }),
      };
      if (isEdit) {
        await taskService.updateTask(task._id, payload);
        toast.success("Task updated");
      } else {
        await taskService.createTask(payload);
        toast.success("Task created");
      }
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIX: The line "const selectedPriority = PRIORITIES.find(...)"
  // that used to be here has been REMOVED. It was never used in
  // the JSX below, causing the no-unused-vars error.

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "var(--radius-xs)",
              background: "var(--accent-surface)", border: "1px solid var(--border-accent)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem",
            }}>✅</div>
            <h2 className="modal-title">{isEdit ? "Edit Task" : "New Task"}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              name="title" type="text" autoFocus
              className={`form-input ${fieldErrors.title ? "error" : ""}`}
              placeholder="e.g. Design authentication flow"
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {fieldErrors.title && <p className="form-error">⚠ {fieldErrors.title}</p>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe what needs to be done…"
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <p className="form-hint">{formData.description.length}/1000</p>
          </div>

          {/* Project */}
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select
              name="projectId"
              className={`form-select ${fieldErrors.projectId ? "error" : ""}`}
              value={formData.projectId}
              onChange={handleChange}
              disabled={isSubmitting || isEdit}
            >
              <option value="">-- Select project --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
            {isEdit && <p className="form-hint">Project cannot be changed after creation</p>}
            {fieldErrors.projectId && <p className="form-error">⚠ {fieldErrors.projectId}</p>}
          </div>

          {/* Assign To */}
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select
              name="assignedTo"
              className="form-select"
              value={formData.assignedTo}
              onChange={handleChange}
              disabled={isSubmitting || !formData.projectId || isLoadingMembers}
            >
              <option value="">
                {isLoadingMembers
                  ? "Loading members…"
                  : !formData.projectId
                  ? "Select a project first"
                  : "-- Unassigned --"}
              </option>
              {projectMembers.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.name} · {m.role?.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Priority — visual button selector */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, priority: p.value }))}
                  disabled={isSubmitting}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "var(--radius-sm)",
                    border: formData.priority === p.value
                      ? `1.5px solid ${p.color}55`
                      : "1.5px solid var(--border)",
                    background: formData.priority === p.value ? `${p.color}12` : "var(--bg-3)",
                    color: formData.priority === p.value ? p.color : "var(--text-3)",
                    cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    transition: "all 0.15s",
                  }}
                >
                  {p.value}
                </button>
              ))}
            </div>
          </div>

          {/* Status + Deadline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={formData.status} onChange={handleChange} disabled={isSubmitting}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input name="deadline" type="date" className="form-input" value={formData.deadline} onChange={handleChange} disabled={isSubmitting} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <><span className="spinner spinner-sm" style={{ borderTopColor: "white" }} /> {isEdit ? "Saving…" : "Creating…"}</>
                : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;