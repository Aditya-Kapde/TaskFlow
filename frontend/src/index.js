import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// ```

// ---

// ## Step 9.8 — Updated folder structure
// ```
// frontend/src/
// ├── components/
// │   ├── common/
// │   │   ├── ProtectedRoute.jsx    ✅
// │   │   ├── Spinner.jsx           ✅
// │   │   └── EmptyState.jsx        ✅ NEW
// │   └── layout/
// │       ├── Navbar.jsx            ✅ NEW
// │       └── Sidebar.jsx           ✅ NEW
// ├── context/
// │   └── AuthContext.jsx           ✅
// ├── hooks/
// │   ├── useAuth.js                ✅
// │   └── useToast.js               ✅
// ├── pages/
// │   ├── auth/
// │   │   ├── Login.jsx             ✅ UPDATED (full implementation)
// │   │   └── Register.jsx          ✅ UPDATED (full implementation)
// │   ├── dashboard/
// │   │   └── Dashboard.jsx         ✅ (placeholder)
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
// ├── App.jsx                       ✅
// ├── index.js                      ✅ UPDATED
// └── index.css                     ✅ NEW