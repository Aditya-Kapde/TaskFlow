import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/helpers";

// ── All 4 roles including ADMIN ────────────────────────────────
const ROLES = [
  {
    value: "PROJECT_MANAGER",
    label: "Project Manager",
    desc:  "Manage projects, members, and tasks",
    icon:  "📋",
    color: "#7c5cfc",
  },
  {
    value: "DEVELOPER",
    label: "Developer",
    desc:  "Work on assigned tasks and collaborate",
    icon:  "⚡",
    color: "#4cc9f0",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    desc:  "View-only access to projects and tasks",
    icon:  "👁",
    color: "#00d68f",
  },
];

const Register = () => {
  const [formData, setFormData] = useState({
    name:            "",
    email:           "",
    password:        "",
    confirmPassword: "",
    role:            "DEVELOPER",
  });

  const [fieldErrors, setFieldErrors]   = useState({});
  const [serverError, setServerError]   = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();
  const toast        = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (serverError) setServerError("");
  };

  const selectRole = (value) => {
    setFormData((p) => ({ ...p, role: value }));
    if (fieldErrors.role) setFieldErrors((p) => ({ ...p, role: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim())                     errors.name            = "Full name is required";
    else if (formData.name.trim().length < 2)      errors.name            = "Name must be at least 2 characters";
    if (!formData.email.trim())                    errors.email           = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email          = "Enter a valid email";
    if (!formData.password)                        errors.password        = "Password is required";
    else if (formData.password.length < 6)         errors.password        = "At least 6 characters required";
    else if (!/\d/.test(formData.password))        errors.password        = "Must contain at least one number";
    if (!formData.confirmPassword)                 errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!formData.role)                            errors.role            = "Please select a role";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setServerError("");
    try {
      const { confirmPassword, ...payload } = formData;
      await register(payload);
      toast.success("Account created! Welcome aboard.");
      navigate("/dashboard");
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.value === formData.role);

  return (
    <div className="auth-root">
      {/* ── Left panel ──────────────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left-orb-1" />
        <div className="auth-left-orb-2" />
        <div className="auth-left-grid" />

        <div className="auth-left-logo">
          <div className="auth-left-logo-inner">
            <div className="auth-left-logo-icon">⚡</div>
            <div>
              <h1>PMS</h1>
            </div>
          </div>
        </div>

        <div className="auth-left-content">
          <h2>Start building with your team today</h2>
          <p>
            Create your account and get access to powerful
            project management tools. Choose your role to
            get started with the right level of access.
          </p>
        </div>

        {/* Role preview card */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.1rem",
          }}
        >
          <p style={{ fontSize: "0.72rem", color: "var(--text-4)", marginBottom: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
            Selected role
          </p>
          {selectedRole && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: 38, height: 38,
                  borderRadius: "var(--radius-sm)",
                  background: `${selectedRole.color}18`,
                  border: `1px solid ${selectedRole.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem",
                }}
              >
                {selectedRole.icon}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-1)" }}>
                  {selectedRole.label}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
                  {selectedRole.desc}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-box" style={{ maxWidth: 460 }}>
          <div className="auth-box-header">
            <h2>Create account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {serverError && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Name + Email side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full name</label>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={`form-input ${fieldErrors.name ? "error" : ""}`}
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {fieldErrors.name && <p className="form-error">⚠ {fieldErrors.name}</p>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email address</label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`form-input ${fieldErrors.email ? "error" : ""}`}
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {fieldErrors.email && <p className="form-error">⚠ {fieldErrors.email}</p>}
              </div>
            </div>

            {/* Role selector */}
            <div className="form-group" style={{ marginTop: "1.1rem" }}>
              <label className="form-label">
                Select your role
                {fieldErrors.role && (
                  <span style={{ color: "var(--danger)", marginLeft: "0.5rem" }}>
                    — {fieldErrors.role}
                  </span>
                )}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
                {ROLES.map((role) => {
                  const isActive = formData.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => selectRole(role.value)}
                      disabled={isSubmitting}
                      style={{
                        padding: "0.7rem 0.85rem",
                        borderRadius: "var(--radius-sm)",
                        border: isActive
                          ? `1.5px solid ${role.color}55`
                          : "1.5px solid var(--border)",
                        background: isActive
                          ? `${role.color}12`
                          : "var(--bg-3)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.55rem",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>{role.icon}</span>
                      <div>
                        <p
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: isActive ? role.color : "var(--text-2)",
                            lineHeight: 1.2,
                          }}
                        >
                          {role.label}
                        </p>
                        <p style={{ fontSize: "0.68rem", color: "var(--text-4)", lineHeight: 1.3, marginTop: "0.1rem" }}>
                          {role.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginTop: "1.1rem" }}>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`form-input ${fieldErrors.password ? "error" : ""}`}
                  placeholder="Min 6 chars, at least one number"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  style={{ paddingRight: "2.8rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", color: "var(--text-3)",
                    fontSize: "0.85rem", padding: 0,
                  }}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {fieldErrors.password && <p className="form-error">⚠ {fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`form-input ${fieldErrors.confirmPassword ? "error" : ""}`}
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {fieldErrors.confirmPassword && (
                <p className="form-error">⚠ {fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-xl"
              disabled={isSubmitting}
              style={{ marginTop: "0.25rem" }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: "white" }} />
                  Creating account...
                </>
              ) : (
                "Create account →"
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;