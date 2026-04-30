const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

const getAllUsers = (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, role, created_at FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getUserById = (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const getProjectMembers = (req, res) => {
  const { projectId } = req.params;

  try {
    // Check if user has access to this project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(projectId, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = db.prepare(`
      SELECT u.id, u.username, u.email, u.role, pm.role as project_role, pm.id as membership_id
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(projectId);

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// Update current user's profile (name and password)
const updateProfile = (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    // Get current user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required to change password' });
      }
      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    // Update username if provided
    if (username && username !== user.username) {
      // Check if username is already taken
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id);
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, req.user.id);
    }

    // Update password if provided
    if (newPassword) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);
    }

    // Return updated user info
    const updatedUser = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(req.user.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Get member dashboard stats
const getMemberDashboard = (req, res) => {
  try {
    const userId = req.user.id;

    // Get tasks assigned to this user
    const totalTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?
    `).get(userId);

    const pendingTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'pending'
    `).get(userId);

    const inProgressTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'in_progress'
    `).get(userId);

    const completedTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status = 'completed'
    `).get(userId);

    const overdueTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE assignee_id = ? AND due_date < datetime('now') AND status != 'completed'
    `).get(userId);

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

    // Get assigned tasks
    const assignedTasks = db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ?
      AND t.status != 'completed'
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.due_date ASC,
        t.created_at DESC
      LIMIT 10
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
      pendingTasks: pendingTasks.count,
      inProgressTasks: inProgressTasks.count,
      completedTasks: completedTasks.count,
      overdueTasks: overdueTasks.count,
      upcomingDeadlines,
      assignedTasks,
      projects
    });
  } catch (error) {
    console.error('Member dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

module.exports = { getAllUsers, getUserById, getProjectMembers, updateProfile, getMemberDashboard };
