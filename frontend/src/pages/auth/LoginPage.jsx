import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/helpers";

const Login = () => {
  const [formData, setFormData]     = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const toast        = useToast();
  const from         = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (serverError) setServerError("");
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim())         errors.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Enter a valid email";
    if (!formData.password)             errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setServerError("");
    try {
      await login(formData);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2>Manage projects with clarity and speed</h2>
          <p>
            A unified workspace for your team to plan, track,
            and ship work — with role-based access that keeps
            everyone focused on what matters.
          </p>
        </div>

        <div className="auth-features">
          {[
            { icon: "🔐", text: "Secure JWT authentication with refresh tokens" },
            { icon: "🎯", text: "Role-based access control for every resource" },
            { icon: "⚡", text: "Real-time task and project collaboration" },
            { icon: "📊", text: "Live dashboard with stats and insights" },
          ].map((f, i) => (
            <div className="auth-feature-item" key={i}>
              <div className="auth-feature-dot">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-box">
          <div className="auth-box-header">
            <h2>Sign in</h2>
            <p>Enter your credentials to access your workspace</p>
          </div>

          {serverError && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
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
              {fieldErrors.email && (
                <p className="form-error">⚠ {fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`form-input ${fieldErrors.password ? "error" : ""}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  style={{ paddingRight: "2.8rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-3)",
                    fontSize: "0.85rem",
                    padding: 0,
                  }}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="form-error">⚠ {fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-xl"
              disabled={isSubmitting}
              style={{ marginTop: "0.5rem" }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: "white" }} />
                  Signing in...
                </>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span>or</span>
            <div className="auth-divider-line" />
          </div>

          <div className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;