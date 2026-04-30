const { db } = require('../config/database');

const getNotifications = (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const getUnreadCount = (req, res) => {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
    res.json({ count: result.count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

const markAsRead = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

const markAllAsRead = (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

const deleteNotification = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(id, req.user.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

const createNotification = (userId, type, title, message, taskId = null, projectId = null) => {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, task_id, project_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, type, title, message, taskId, projectId);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
