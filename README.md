# Team Task Manager - Full Stack Application

A collaborative project management tool where users can create projects, assign tasks, and track progress with role-based access control (Admin/Member).

## Features

- **Authentication**: Sign up, login, JWT-based session management
- **Project Management**: Create projects, add/remove team members, assign roles
- **Task Management**: Create, assign, update, and track tasks
- **Status Tracking**: Track task status (pending, in_progress, completed)
- **Priority Levels**: Low, medium, high priority tasks
- **Due Dates**: Set and track task due dates with overdue warnings
- **Dashboard**: Overview of all tasks, progress stats, and recent activity
- **Role-Based Access**: Admin and member roles with different permissions

## Tech Stack

### Backend
- Node.js + Express.js
- SQLite (better-sqlite3)
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18 with Vite
- React Router v6
- Axios for API calls
- Custom CSS (dark theme)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   The API will run on `http://localhost:3001`

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   The app will open on `http://localhost:5173`

### Default Routes

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member
- `GET /api/projects/:id/members` - List members

### Tasks
- `GET /api/tasks/project/:projectId` - List project tasks
- `POST /api/tasks/project/:projectId` - Create task
- `GET /api/tasks/:id` - Get task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Dashboard
- `GET /api/dashboard` - Get dashboard stats

## Database Schema

### Users
- id, username, email, password, role (admin/member), created_at

### Projects
- id, name, description, owner_id, created_at

### Project Members
- id, project_id, user_id, role (admin/member)

### Tasks
- id, title, description, status, priority, due_date, project_id, assignee_id, created_by, created_at, updated_at

## Role Permissions

### Admin
- Can view all projects
- Can manage all projects (create, update, delete)
- Can add/remove members from any project
- Full access to all features

### Member
- Can only access projects they're members of
- Can create tasks in their projects
- Can update tasks in their projects
- Can view project members

## Demo Account

After registering, you can:
1. Create a new project
2. Invite other users (they must register first)
3. Assign roles (admin/member) to team members
4. Create and assign tasks
5. Track progress via dashboard

---

Built with ❤️ using Node.js, Express, React, and SQLite
