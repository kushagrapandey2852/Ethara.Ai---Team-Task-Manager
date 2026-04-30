const express = require('express');
const cors = require('cors');
const { initDb, get, all, run } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const categoryRoutes = require('./routes/categories');
const { auth } = require('./middleware/auth');
const { db } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);

// Dashboard endpoint - routes based on user role
app.get('/api/dashboard', auth, (req, res) => {
  console.log('Dashboard route hit by user:', req.user.username);
  try {
    // If admin, use the full analytics dashboard
    if (req.user.role === 'admin') {
      const adminStats = get(`
        SELECT COUNT(*) as total FROM tasks
      `);
      
      const taskStats = get(`
        SELECT 
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM tasks
      `);
      
      const overdueTasks = get(`
        SELECT COUNT(*) as count FROM tasks
        WHERE due_date < datetime('now') AND status != 'completed'
      `);
      
      const totalProjects = get(`SELECT COUNT(*) as count FROM projects`);
      const teamMembers = get(`SELECT COUNT(*) as count FROM users`);
      
      const projects = all(`
        SELECT p.id, p.name, u.username as owner_name
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 10
      `);
      
      const recentTasks = all(`
        SELECT t.*, p.name as project_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `);
      
      return res.json({
        totalTasks: adminStats?.total || 0,
        pendingTasks: taskStats?.pending || 0,
        inProgressTasks: taskStats?.in_progress || 0,
        completedTasks: taskStats?.completed || 0,
        overdueTasks: overdueTasks?.count || 0,
        totalProjects: totalProjects?.count || 0,
        teamMembers: teamMembers?.count || 0,
        projects: projects || [],
        recentTasks: recentTasks || []
      });
    }
    
    // For members, get their personalized dashboard
    const userId = req.user.id;
    
    // Get tasks assigned to this user
    const totalTasks = get(`SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?`, [userId]);
    const pendingTasks = get(`SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'pending'`, [userId]);
    const inProgressTasks = get(`SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'in_progress'`, [userId]);
    const completedTasks = get(`SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'completed'`, [userId]);
    const overdueTasks = get(`
      SELECT COUNT(*) as count FROM tasks
      WHERE assignee_id = ? AND due_date < datetime('now') AND status != 'completed'
    `, [userId]);
    
    // Get assigned tasks
    const assignedTasks = all(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ?
      ORDER BY 
        CASE t.status 
          WHEN 'pending' THEN 1 
          WHEN 'in_progress' THEN 2 
          WHEN 'completed' THEN 3 
        END,
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.due_date ASC
      LIMIT 10
    `, [userId]);
    
    // Get upcoming deadlines (next 7 days)
    const upcomingDeadlines = all(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ?
      AND t.status != 'completed'
      AND t.due_date IS NOT NULL
      AND t.due_date <= datetime('now', '+7 days')
      AND t.due_date >= datetime('now')
      ORDER BY t.due_date ASC
      LIMIT 5
    `, [userId]);
    
    // Get projects user is member of
    const projects = all(`
      SELECT p.*, u.username as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json({
      totalTasks: totalTasks?.count || 0,
      pendingTasks: pendingTasks?.count || 0,
      inProgressTasks: inProgressTasks?.count || 0,
      completedTasks: completedTasks?.count || 0,
      overdueTasks: overdueTasks?.count || 0,
      projects: projects || [],
      recentTasks: assignedTasks || [],
      upcomingDeadlines: upcomingDeadlines || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDb();
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
