const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'team-task-manager-secret-key-2024';

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);
    const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(decoded.userId);
    console.log('Found user:', user);

    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { auth, adminOnly, generateToken, JWT_SECRET };
