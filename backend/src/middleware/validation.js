const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  next();
};

const validateProject = (req, res, next) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  if (name.length < 3) {
    return res.status(400).json({ error: 'Project name must be at least 3 characters' });
  }

  next();
};

const validateTask = (req, res, next) => {
  const { title, status, priority, assignee_id } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  if (title.length < 3) {
    return res.status(400).json({ error: 'Task title must be at least 3 characters' });
  }

  const validStatuses = ['pending', 'in_progress', 'completed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be pending, in_progress, or completed' });
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority. Must be low, medium, or high' });
  }

  next();
};

const validateProjectMember = (req, res, next) => {
  const { user_id, role } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const validRoles = ['admin', 'member'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be admin or member' });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProject,
  validateTask,
  validateProjectMember
};
