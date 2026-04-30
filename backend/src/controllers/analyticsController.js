const { db } = require('../config/database');

// Get dashboard stats - different for admin vs member
const getDashboardStats = (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const userId = req.user.id;

  if (!isAdmin) {
    // Member-specific dashboard stats
    try {
      // Get tasks assigned to this user
      const totalTasks = db.prepare(`
        SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?
      `).get(userId);

      const taskStats = db.prepare(`
        SELECT 
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM tasks WHERE assignee_id = ?
      `).get(userId);

      const overdueTasks = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE assignee_id = ? AND due_date < datetime('now') AND status != 'completed'
      `).get(userId);

      // Get tasks assigned to this user (recent)
      const recentTasks = db.prepare(`
        SELECT t.*, p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
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
          t.due_date ASC,
          t.created_at DESC
        LIMIT 10
      `).all(userId);

      // Get upcoming deadlines (next 7 days)
      const upcomingDeadlines = db.prepare(`
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
      `).all(userId);

      // Get projects user is member of
      const projects = db.prepare(`
        SELECT p.*, u.username as owner_name,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
        ORDER BY p.created_at DESC
      `).all(userId);

      res.json({
        totalTasks: totalTasks.count,
        pendingTasks: taskStats.pending || 0,
        inProgressTasks: taskStats.in_progress || 0,
        completedTasks: taskStats.completed || 0,
        overdueTasks: overdueTasks.count,
        recentTasks,
        upcomingDeadlines,
        projects
      });
    } catch (error) {
      console.error('Member dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
    return;
  }

  // Admin dashboard stats
  try {
    // Get total tasks count
    const totalTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
    `).get();

    // Get tasks by status
    const taskStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
    `).get();

    // Get overdue tasks count
    const overdueTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE due_date < datetime('now')
      AND status != 'completed'
    `).get();

    // Get total projects count
    const totalProjects = db.prepare(`
      SELECT COUNT(*) as count FROM projects
    `).get();

    // Get active projects (with incomplete tasks)
    const activeProjects = db.prepare(`
      SELECT COUNT(DISTINCT project_id) as count FROM tasks
      WHERE status != 'completed'
    `).get();

    // Get total team members
    const teamMembers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM users
    `).get();

    // Get recent tasks
    const recentTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.username as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all();

    // Get recent projects
    const recentProjects = db.prepare(`
      SELECT p.*, u.username as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `).all();

    // Get activity feed (recent actions)
    const activityFeed = db.prepare(`
      SELECT 
        'task_created' as type,
        t.title as description,
        u.username as user,
        t.created_at as timestamp
      FROM tasks t
      JOIN users u ON t.created_by = u.id
      UNION ALL
      SELECT 
        'task_completed' as type,
        t.title as description,
        u.username as user,
        t.updated_at as timestamp
      FROM tasks t
      JOIN users u ON t.updated_by = u.id
      WHERE t.status = 'completed'
      ORDER BY timestamp DESC
      LIMIT 10
    `).all();

    res.json({
      totalTasks: totalTasks.count,
      pendingTasks: taskStats.pending || 0,
      inProgressTasks: taskStats.in_progress || 0,
      completedTasks: taskStats.completed || 0,
      overdueTasks: overdueTasks.count,
      totalProjects: totalProjects.count,
      activeProjects: activeProjects.count,
      teamMembers: teamMembers.count,
      recentTasks,
      recentProjects,
      projectProgress,
      activityFeed
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get analytics/reports data for admin
const getAnalytics = (req, res) => {
  try {
    // Task completion rate
    const completionRate = db.prepare(`
      SELECT 
        CAST(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / 
        NULLIF(CAST(COUNT(*) AS FLOAT), 0) * 100 as rate
      FROM tasks
    `).get();

    // Tasks completed this week
    const completedThisWeek = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE status = 'completed'
      AND updated_at >= datetime('now', '-7 days')
    `).get();

    // Tasks created this week
    const createdThisWeek = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE created_at >= datetime('now', '-7 days')
    `).get();

    // Member performance (tasks completed by each user)
    const memberPerformance = db.prepare(`
      SELECT u.id, u.username,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status = 'completed') as completed,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id) as total,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND due_date < datetime('now') AND status != 'completed') as overdue
      FROM users u
      WHERE u.id IN (SELECT DISTINCT assignee_id FROM tasks WHERE assignee_id IS NOT NULL)
      ORDER BY completed DESC
    `).all();

    // Project progress percentages
    const projectProgress = db.prepare(`
      SELECT p.id, p.name, p.description, u.username as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'in_progress') as in_progress_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'pending') as pending_tasks
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `).all();

    // Calculate progress percentage for each project
    const projectsWithProgress = projectProgress.map(p => ({
      ...p,
      progress: p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0
    }));

    // Overdue analysis
    const overdueAnalysis = db.prepare(`
      SELECT 
        p.id, p.name,
        COUNT(*) as overdue_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.due_date < datetime('now')
      AND t.status != 'completed'
      GROUP BY p.id
      ORDER BY overdue_count DESC
      LIMIT 10
    `).all();

    // Tasks by priority
    const tasksByPriority = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tasks
      GROUP BY priority
    `).all();

    // Activity feed (recent actions)
    const activityFeed = db.prepare(`
      SELECT 
        'task_created' as type,
        t.title as description,
        u.username as user,
        t.created_at as timestamp
      FROM tasks t
      JOIN users u ON t.created_by = u.id
      UNION ALL
      SELECT 
        'task_completed' as type,
        t.title as description,
        u.username as user,
        t.updated_at as timestamp
      FROM tasks t
      JOIN users u ON t.updated_by = u.id
      WHERE t.status = 'completed'
      ORDER BY timestamp DESC
      LIMIT 20
    `).all();

    res.json({
      completionRate: completionRate.rate || 0,
      completedThisWeek: completedThisWeek.count,
      createdThisWeek: createdThisWeek.count,
      memberPerformance,
      projectsWithProgress,
      overdueAnalysis,
      tasksByPriority,
      activityFeed
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Get all users for admin (system-wide)
const getAllUsers = (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM project_members WHERE user_id = u.id) as project_count,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id) as assigned_tasks,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id AND status = 'completed') as completed_tasks
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role (admin only)
const updateUserRole = (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    // Only admins can change roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }

    // Cannot change own role
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);

    const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Delete user (admin only)
const deleteUser = (req, res) => {
  const { userId } = req.params;

  try {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    // Cannot delete self
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
  getAllUsers,
  updateUserRole,
  deleteUser
};
