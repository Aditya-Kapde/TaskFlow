# ⚡ TaskFlow

A full-stack **MERN** application for managing projects and tasks with secure JWT authentication and role-based access control (RBAC).

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Roles & Permissions](#roles--permissions)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Screenshots](#screenshots)
- [Contributing](#contributing)

---

## Overview

A production-quality project management system where teams can collaborate on projects and tasks. The system supports secure authentication, granular role-based authorization, project and task management, and team collaboration through comments.

---

## Features

**Authentication**
- User registration and login
- JWT access tokens (15 min expiry)
- Refresh tokens stored in httpOnly cookies (7 day expiry)
- Automatic silent token refresh via Axios interceptors
- Secure logout with server-side token invalidation

**User Management**
- Create and assign roles to users
- Activate and deactivate accounts
- Admin-only user management panel

**Project Management**
- Create, edit, and delete projects
- Add and remove project members with project-level roles
- Filter projects by status and search by title
- Pagination support

**Task Management**
- Create tasks with priority, status, deadline, and assignee
- Full update for admins and project managers
- Status-only update for developers (assigned tasks only)
- Filter by status, priority, and project
- Inline status updates from the task grid

**Comments**
- Add comments to tasks
- Immutable comment history (audit trail)
- Paginated comment loading
- Viewers cannot post comments

**Dashboard**
- Live stat cards (projects, tasks, assigned to me, overdue)
- Tasks by status progress bars
- Tasks by priority breakdown
- Recent projects table

---

## Tech Stack

**Frontend**
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Axios | HTTP client with interceptors |
| Context API | Global auth state |
| React Toastify | Notifications |

**Backend**
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM |
| JSON Web Token | Authentication |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| cookie-parser | Refresh token cookie |
| cors | Cross-origin requests |

---

## Roles & Permissions

| Feature | ADMIN | PROJECT MANAGER | DEVELOPER | VIEWER |
|---|:---:|:---:|:---:|:---:|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ❌ | ❌ |
| Edit projects | ✅ | ✅ * | ❌ | ❌ |
| Delete projects | ✅ | ❌ | ❌ | ❌ |
| Manage members | ✅ | ✅ * | ❌ | ❌ |
| View projects | ✅ | ✅ * | ✅ * | ✅ * |
| Create tasks | ✅ | ✅ * | ❌ | ❌ |
| Edit tasks (full) | ✅ | ✅ * | ❌ | ❌ |
| Update task status | ✅ | ✅ * | ✅ ** | ❌ |
| Delete tasks | ✅ | ✅ * | ❌ | ❌ |
| Post comments | ✅ | ✅ * | ✅ * | ❌ |
| View comments | ✅ | ✅ * | ✅ * | ✅ * |

> `*` Must be a member of that project
> `**` Only on tasks assigned to them

---

## Project Structure

```
project-management-system/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Register, login, logout, refresh
│   │   ├── userController.js        # User CRUD and role management
│   │   ├── projectController.js     # Project CRUD and member management
│   │   ├── taskController.js        # Task CRUD, status update, dashboard
│   │   └── commentController.js     # Comment creation and retrieval
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── roleMiddleware.js        # RBAC enforcement
│   │   ├── errorMiddleware.js       # Global error handler
│   │   └── validateMiddleware.js    # express-validator error handler
│   ├── models/
│   │   ├── User.js                  # User schema with bcrypt hooks
│   │   ├── Project.js               # Project schema with members array
│   │   ├── Task.js                  # Task schema
│   │   └── Comment.js               # Comment schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── commentRoutes.js
│   ├── services/
│   │   └── tokenService.js          # JWT generation, verification, cookies
│   ├── validators/
│   │   ├── authValidators.js
│   │   ├── userValidators.js
│   │   ├── projectValidators.js
│   │   ├── taskValidators.js
│   │   └── commentValidators.js
│   ├── utils/
│   │   └── apiResponse.js           # Consistent response shape
│   ├── .env.example
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── comments/
        │   │   └── CommentSection.jsx
        │   ├── common/
        │   │   ├── EmptyState.jsx
        │   │   ├── ProtectedRoute.jsx
        │   │   └── Spinner.jsx
        │   ├── layout/
        │   │   ├── Navbar.jsx
        │   │   └── Sidebar.jsx
        │   ├── projects/
        │   │   ├── MemberList.jsx
        │   │   ├── ProjectCard.jsx
        │   │   └── ProjectForm.jsx
        │   └── tasks/
        │       ├── TaskCard.jsx
        │       └── TaskForm.jsx
        ├── context/
        │   └── AuthContext.jsx       # Global auth state and role helpers
        ├── hooks/
        │   ├── useAuth.js
        │   └── useToast.js
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.jsx
        │   │   └── Register.jsx
        │   ├── dashboard/
        │   │   └── Dashboard.jsx
        │   ├── projects/
        │   │   ├── Projects.jsx
        │   │   └── ProjectDetails.jsx
        │   └── tasks/
        │       └── Tasks.jsx
        ├── services/
        │   ├── axios.js              # Axios instance with interceptors
        │   ├── authService.js
        │   ├── commentService.js
        │   ├── projectService.js
        │   ├── taskService.js
        │   └── userService.js
        ├── utils/
        │   └── helpers.js
        ├── App.jsx
        ├── index.css
        └── index.js
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v16 or higher
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection string
- [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/project-management-system.git
cd project-management-system
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Start the backend development server:

```bash
npm run dev
```

The API will be running at `http://localhost:5000`

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

Start the frontend development server:

```bash
npm start
```

The app will open at `http://localhost:3000`

### 4. Create your first admin user

Register at `http://localhost:3000/register` and select the **ADMIN** role. This first admin can then create other users and assign roles from the backend API.

---

## Environment Variables

### Backend — `backend/.env`

```env
NODE_ENV=development
PORT=5000

MONGO_URI=mongodb://localhost:27017/project_management

ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000
```

> **Important:** `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` must be different strings. Use a password generator to create long random values for production.

### Frontend — `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and get tokens |
| POST | `/api/auth/logout` | Private | Logout and clear cookie |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/auth/me` | Private | Get current user profile |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | ADMIN | Get all users |
| GET | `/api/users/:id` | ADMIN | Get user by ID |
| PATCH | `/api/users/:id` | ADMIN | Update user name/email |
| PATCH | `/api/users/:id/role` | ADMIN | Update user role |
| PATCH | `/api/users/:id/deactivate` | ADMIN | Deactivate user |
| PATCH | `/api/users/:id/activate` | ADMIN | Activate user |

### Projects

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/projects` | All roles | Get all projects (filtered) |
| POST | `/api/projects` | ADMIN, PM | Create project |
| GET | `/api/projects/:id` | Members | Get project by ID |
| PUT | `/api/projects/:id` | ADMIN, PM | Update project |
| DELETE | `/api/projects/:id` | ADMIN | Delete project |
| GET | `/api/projects/:id/members` | Members | Get project members |
| POST | `/api/projects/:id/members` | ADMIN, PM | Add member |
| DELETE | `/api/projects/:id/members/:userId` | ADMIN, PM | Remove member |

### Tasks

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/tasks` | All roles | Get all tasks (filtered) |
| POST | `/api/tasks` | ADMIN, PM | Create task |
| GET | `/api/tasks/dashboard` | All roles | Get dashboard stats |
| GET | `/api/tasks/project/:projectId` | Members | Get tasks by project |
| GET | `/api/tasks/:id` | Members | Get task by ID |
| PUT | `/api/tasks/:id` | ADMIN, PM | Full task update |
| PATCH | `/api/tasks/:id/status` | ADMIN, PM, DEV | Update task status |
| DELETE | `/api/tasks/:id` | ADMIN, PM | Delete task |

### Comments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/comments` | ADMIN, PM, DEV | Add comment |
| GET | `/api/comments/task/:taskId` | All roles | Get comments for task |
| GET | `/api/comments/my-comments` | All roles | Get my comments |
| GET | `/api/comments/:id` | All roles | Get comment by ID |

> **PM** = PROJECT_MANAGER | **DEV** = DEVELOPER
> All endpoints marked "Members" or role-restricted also require project membership.

---

## Authentication Flow

```
Login
  │
  ▼
POST /api/auth/login
  │
  ├── Returns: accessToken (JWT, 15 min)
  └── Sets:    refreshToken (httpOnly cookie, 7 days)

Every API Request
  │
  ▼
Axios request interceptor attaches:
Authorization: Bearer <accessToken>

Token Expires (401 response)
  │
  ▼
Axios response interceptor calls POST /api/auth/refresh
  │
  ├── Success → stores new accessToken, retries original request
  └── Failure → clears storage, redirects to /login

Logout
  │
  ▼
POST /api/auth/logout
  ├── Clears refreshToken from database
  └── Clears httpOnly cookie from browser
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Commit message convention

```
feat:     new feature
fix:      bug fix
refactor: code change that is not a fix or feature
docs:     documentation changes
style:    formatting, missing semicolons, etc.
test:     adding or updating tests
```

---

## License

This project is licensed under the MIT License.

---

<p align="center">Built with the MERN stack — MongoDB, Express, React, Node.js</p>
