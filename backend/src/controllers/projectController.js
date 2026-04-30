const { db } = require('../config/database');

const getProjects = (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, u.username as owner_name, c.name as category_name, c.color as category_color,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_categories c ON p.category_id = c.id
      WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
      ORDER BY p.created_at DESC
    `).all(req.user.id);

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

const getProjectById = (req, res) => {
  const { id } = req.params;

  try {
    // Check if user has access to this project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const project = db.prepare(`
      SELECT p.*, u.username as owner_name, c.name as category_name, c.color as category_color
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

const createProject = (req, res) => {
  const { name, description, deadline, category_id } = req.body;

  try {
    const result = db.prepare(
      'INSERT INTO projects (name, description, deadline, category_id, owner_id) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description || null, deadline || null, category_id || null, req.user.id);

    // Add owner as admin member
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, req.user.id, 'admin');

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

const updateProject = (req, res) => {
  const { id } = req.params;
  const { name, description, deadline, category_id } = req.body;

  try {
    // Check if user is admin of the project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = ?'
    ).get(id, req.user.id, 'admin');

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update this project' });
    }

    db.prepare(
      'UPDATE projects SET name = ?, description = ?, deadline = ?, category_id = ? WHERE id = ?'
    ).run(name, description || null, deadline || null, category_id || null, id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

const deleteProject = (req, res) => {
  const { id } = req.params;

  try {
    // Check if user is owner or admin
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the owner or admin can delete this project' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

const addMember = (req, res) => {
  const { id } = req.params;
  const { user_id, role = 'member' } = req.body;

  try {
    // Check if user is admin of the project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = ?'
    ).get(id, req.user.id, 'admin');

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    // Check if user exists
    const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a member
    const existingMember = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(id, user_id);

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(id, user_id, role);

    const newMember = db.prepare(`
      SELECT pm.*, u.username, u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ? AND pm.user_id = ?
    `).get(id, user_id);

    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
};

const removeMember = (req, res) => {
  const { id, userId } = req.params;

  try {
    // Check if user is admin of the project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = ?'
    ).get(id, req.user.id, 'admin');

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    // Check if trying to remove self
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    db.prepare(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
    ).run(id, userId);

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

const getMembers = (req, res) => {
  const { id } = req.params;

  try {
    // Check if user has access
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = db.prepare(`
      SELECT u.id, u.username, u.email, u.role as user_role, pm.role as project_role, pm.id as membership_id
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(id);

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getMembers
};
