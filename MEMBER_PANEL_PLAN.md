# Member Panel Enhancement Plan

## Current Status
The core MEMBER PANEL features are already implemented:
- ✅ Dashboard with personalized stats
- ✅ My Tasks (view assigned tasks)
- ✅ Update task status (To Do → In Progress → Done)
- ✅ My Projects view
- ✅ Restrictions enforced
- ✅ Profile/Settings

## Missing Optional Features to Implement
1. **Comments on tasks** - Members can add comments to tasks
2. **File attachments** - Members can attach files to tasks  
3. **Notifications** - System for task updates, assignments, deadlines

## Implementation Plan

### Phase 1: Database & Backend
- [ ] Add `task_comments` table to store task comments
- [ ] Add `task_attachments` table to store file metadata
- [ ] Add `notifications` table for notification system
- [ ] Add API routes for comments CRUD
- [ ] Add API routes for attachments
- [ ] Add API routes for notifications (get, mark as read)

### Phase 2: Frontend - Comments
- [ ] Update ProjectDetail.jsx - add comments section
- [ ] Add comment input UI
- [ ] Display comments thread on tasks

### Phase 3: Frontend - Attachments
- [ ] Update ProjectDetail.jsx - add file attachment UI
- [ ] Add file upload handler
- [ ] Display attachments list on tasks

### Phase 4: Frontend - Notifications
- [ ] Add NotificationBell component to navbar
- [ ] Add NotificationsDropdown component
- [ ] Create dedicated Notifications page
- [ ] Update App.jsx with notification routes
- [ ] Auto-create notifications on task events

## Files to Modify
1. `backend/src/config/database.js` - Add new tables
2. `backend/src/controllers/taskController.js` - Add comment/attachment handlers
3. `backend/src/routes/tasks.js` - Add new routes
4. `frontend/src/pages/ProjectDetail.jsx` - Add comments & attachments UI
5. `frontend/src/pages/Dashboard.jsx` - Add notifications bell
6. `frontend/src/App.jsx` - Add notifications route
7. `frontend/src/styles/main.css` - Add notification styles
