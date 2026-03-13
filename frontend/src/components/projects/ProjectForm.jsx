import { useState, useEffect } from "react";
import projectService from "../../services/projectService";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/helpers";

const STATUS_OPTIONS = [
  { value: "PLANNING",    label: "Planning",    color: "#9899b8" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#7c5cfc" },
  { value: "ON_HOLD",     label: "On Hold",     color: "#ffb547" },
  { value: "COMPLETED",   label: "Completed",   color: "#00d68f" },
  { value: "CANCELLED",   label: "Cancelled",   color: "#ff4d6d" },
];

const ProjectForm = ({ project, onSuccess, onClose }) => {
  const isEdit = !!project;

  const [formData, setFormData] = useState({
    title:       "",
    description: "",
    status:      "PLANNING",
    deadline:    "",
  });

  const [fieldErrors, setFieldErrors]   = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (project) {
      setFormData({
        title:       project.title       || "",
        description: project.description || "",
        status:      project.status      || "PLANNING",
        deadline:    project.deadline
          ? new Date(project.deadline).toISOString().split("T")[0]
          : "",
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim())               errors.title = "Project title is required";
    else if (formData.title.trim().length < 3) errors.title = "At least 3 characters";
    if (formData.description.length > 500)    errors.description = "Max 500 characters";
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
        status:      formData.status,
        ...(formData.deadline && { deadline: formData.deadline }),
      };
      if (isEdit) {
        await projectService.updateProject(project._id, payload);
        toast.success("Project updated");
      } else {
        await projectService.createProject(payload);
        toast.success("Project created");
      }
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === formData.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "var(--radius-xs)",
              background: "var(--accent-surface)", border: "1px solid var(--border-accent)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem",
            }}>📁</div>
            <h2 className="modal-title">{isEdit ? "Edit Project" : "New Project"}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input
              name="title"
              type="text"
              className={`form-input ${fieldErrors.title ? "error" : ""}`}
              placeholder="e.g. Website Redesign"
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting}
              autoFocus
            />
            {fieldErrors.title && <p className="form-error">⚠ {fieldErrors.title}</p>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe the project goals and scope..."
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <p className="form-hint">{formData.description.length}/500 characters</p>
            {fieldErrors.description && <p className="form-error">⚠ {fieldErrors.description}</p>}
          </div>

          {/* Status + Deadline side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {/* Status color indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: selectedStatus?.color, boxShadow: `0 0 6px ${selectedStatus?.color}` }} />
                <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>
                  {selectedStatus?.label}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                name="deadline"
                type="date"
                className="form-input"
                value={formData.deadline}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="spinner spinner-sm" style={{ borderTopColor: "white" }} />
                {isEdit ? "Saving..." : "Creating..."}</>
              ) : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;