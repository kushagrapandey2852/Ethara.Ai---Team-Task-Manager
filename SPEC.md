# Team Task Manager - Full Stack Application Specification

## 1. Project Overview

**Project Name:** Team Task Manager
**Type:** Full-Stack Web Application
**Core Functionality:** A collaborative project management tool where users can create projects, assign tasks, and track progress with role-based access control (Admin/Member).
**Target Users:** Teams and organizations needing task management with proper access control

---

## 2. Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3) - zero configuration, file-based
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **API Style:** RESTful JSON API

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router v6
- **State Management:** React Context + useReducer
- **HTTP Client:** Axios
- **Styling:** Custom CSS (no Tailwind)

---

## 3. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### Project Members Table (Many-to-Many)
```sql
CREATE TABLE project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(project_id, user_id)
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  due_date DATETIME,
  project_id INTEGER NOT NULL,
  assignee_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## 4. API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (admin only)
- `DELETE /api/projects/:id` - Delete project (admin only)
- `POST /api/projects/:id/members` - Add member to project
- `DELETE /api/projects/:id/members/:userId` - Remove member
- `GET /api/projects/:id/members` - List project members

### Tasks
- `GET /api/projects/:projectId/tasks` - List project tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Dashboard
- `GET /api/dashboard` - Get dashboard stats (tasks by status, overdue count)

---

## 5. Security & Validation

### Password Requirements
- Minimum 6 characters

### Input Validation
- Email format validation
- Required field validation
- Role validation (admin/member)
- Status validation (pending/in_progress/completed)
- Priority validation (low/medium/high)

### Authorization Rules
- **Admin:** Full access to all projects, can manage members
- **Member:** Access only to projects they're members of, can create/update own tasks

---

## 6. Frontend Pages & Components

### Pages
1. **Login Page** - `/login`
2. **Register Page** - `/register`
3. **Dashboard Page** - `/` (protected)
4. **Projects List Page** - `/projects` (protected)
5. **Project Detail Page** - `/projects/:id` (protected)
6. **Task Detail Page** - `/projects/:projectId/tasks/:taskId` (protected)

### Components
- `Navbar` - Navigation with user info and logout
- `ProjectCard` - Project summary card
- `TaskCard` - Task summary card
- `TaskForm` - Create/edit task form
- `ProjectForm` - Create/edit project form
- `MemberList` - Project members list
- `StatusBadge` - Task status indicator
- `PriorityBadge` - Task priority indicator
- `PrivateRoute` - Protected route wrapper
- `Alert` - Notification component

---

## 7. UI/UX Design

### Color Palette
- **Background:** #0f0f1a (dark navy)
- **Surface:** #1a1a2e (dark purple-navy)
- **Primary:** #6c5ce7 (purple)
- **Secondary:** #00cec9 (teal)
- **Accent:** #fd79a8 (pink)
- **Success:** #00b894 (green)
- **Warning:** #fdcb6e (yellow)
- **Error:** #e17055 (coral)
- **Text Primary:** #ffffff
- **Text Secondary:** #a0a0b0

### Typography
- **Headings:** 'Outfit', sans-serif (Google Fonts)
- **Body:** 'DM Sans', sans-serif (Google Fonts)
- **Sizes:** H1: 2.5rem, H2: 2rem, H3: 1.5rem, Body: 1rem

### Layout
- Max content width: 1200px
- Sidebar + main content layout on dashboard
- Card-based grid layout
- Responsive breakpoints: 768px, 1024px

### Animations
- Page transitions: fade in (300ms)
- Card hover: subtle lift with shadow
- Button hover: brightness increase
- Loading states: skeleton animation

---

## 8. Acceptance Criteria

### Authentication
- [ ] User can register with username, email, password
- [ ] User can login with email and password
- [ ] JWT token stored in localStorage
- [ ] Protected routes redirect to login

### Projects
- [ ] User can create a new project
- [ ] User can view list of their projects
- [ ] Project owner can add/remove members
- [ ] Project owner can assign admin role to members
- [ ] User can only see projects they're member of

### Tasks
- [ ] Project member can create a task
- [ ] Project member can assign task to another member
- [ ] Task has status: pending, in_progress, completed
- [ ] Task has priority: low, medium, high
- [ ] Task has optional due date
- [ ] User can update task status/priority
- [ ] User can delete tasks in their projects

### Dashboard
- [ ] Shows total task count
- [ ] Shows task count by status
- [ ] Shows overdue task count
- [ ] Shows recent activity

### Role-Based Access
- [ ] Admin can manage all projects
- [ ] Member can only access assigned projects
- [ ] Only assignee can complete their tasks

---

## 9. Project Structure

```
/team-task-manager
├── /backend
│   ├── /src
│   │   ├── /config
│   │   │   └── database.js
│   │   ├── /controllers
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── userController.js
│   │   ├── /middleware
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── /routes
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── tasks.js
│   │   │   └── users.js
│   │   ├── /utils
│   │   │   └── helpers.js
│   │   └── index.js
│   ├── package.json
│   └── database.sqlite
├── /frontend
│   ├── /public
│   ├── /src
│   │   ├── /components
│   │   ├── /context
│   │   ├── /pages
│   │   ├── /styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
