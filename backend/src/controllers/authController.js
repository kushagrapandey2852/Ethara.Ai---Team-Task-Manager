const bcrypt = require('bcryptjs');
const { get, run, all } = require('../config/database');
const { generateToken } = require('../middleware/auth');

const register = (req, res) => {
  const { username, email, password, role = 'member' } = req.body;

  // Check if user already exists
  const existingUser = get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Validate role
  const validRole = ['admin', 'member'].includes(role) ? role : 'member';

  try {
    run(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, validRole]
    );

    const user = get('SELECT id, username, email, role FROM users WHERE email = ?', [email]);
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

const login = (req, res) => {
  const { email, password } = req.body;

  const user = get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;

  res.json({ user: userWithoutPassword, token });
};

const getMe = (req, res) => {
  const { password, ...user } = req.user;
  res.json(user);
};

module.exports = { register, login, getMe };
