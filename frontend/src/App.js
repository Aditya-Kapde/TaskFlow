import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import useAuth from "./hooks/useAuth";

import Login from "./pages/auth/LoginPage";
import Register from "./pages/auth/RegisterPage";
import Dashboard from "./pages/dashboard/DashboardPage";
import Projects from "./pages/projects/Projects";
import ProjectDetails from "./pages/projects/ProjectDetails";
import Tasks from "./pages/tasks/Tasks";

// ─── Public Route ──────────────────────────────────────────────
// Redirects already-authenticated users away from login/register
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Wait for auth check

  // Already logged in — send to dashboard
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
};

// ─── App Routes ────────────────────────────────────────────────
// Defined as a separate component so it can use useAuth
// (which needs AuthProvider to already be in the tree)
const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Root redirect ─────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ── Public routes ─────────────────────────────────── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* ── Protected routes ──────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks" element={<Tasks />} />
      </Route>

      {/* ── Catch-all ─────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <ToastContainer />
    </AuthProvider>
  );
};

export default App;
// ```

// ---

// ## Step 10.4 — Updated folder structure
// ```
// frontend/src/
// ├── components/
// │   ├── common/
// │   │   ├── ProtectedRoute.jsx    ✅
// │   │   ├── Spinner.jsx           ✅
// │   │   └── EmptyState.jsx        ✅
// │   └── layout/
// │       ├── Navbar.jsx            ✅
// │       └── Sidebar.jsx           ✅
// ├── context/
// │   └── AuthContext.jsx           ✅
// ├── hooks/
// │   ├── useAuth.js                ✅
// │   └── useToast.js               ✅
// ├── pages/
// │   ├── auth/
// │   │   ├── Login.jsx             ✅
// │   │   └── Register.jsx          ✅
// │   ├── dashboard/
// │   │   └── Dashboard.jsx         ✅ NEW
// │   ├── projects/
// │   │   ├── Projects.jsx          ✅ (placeholder)
// │   │   └── ProjectDetails.jsx    ✅ (placeholder)
// │   └── tasks/
// │       └── Tasks.jsx             ✅ (placeholder)
// ├── services/
// │   ├── axios.js                  ✅
// │   ├── authService.js            ✅
// │   ├── userService.js            ✅
// │   ├── projectService.js         ✅
// │   ├── taskService.js            ✅
// │   └── commentService.js         ✅
// ├── utils/
// │   └── helpers.js                ✅
// ├── App.jsx                       ✅ UPDATED
// ├── index.js                      ✅
// └── index.css                     ✅