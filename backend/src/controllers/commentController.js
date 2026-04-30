const { db } = require('../config/database');

const getComments = (req, res) => {
  const { taskId } = req.params;

  try {
    const comments = db.prepare(`
      SELECT c.*, u.username
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `).all(taskId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

const addComment = (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;

  try {
    const result = db.prepare(
      'INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)'
    ).run(taskId, req.user.id, content);

    const comment = db.prepare(`
      SELECT c.*, u.username
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

const deleteComment = (req, res) => {
  const { id } = req.params;

  try {
    const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    db.prepare('DELETE FROM task_comments WHERE id = ?').run(id);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

module.exports = {
  getComments,
  addComment,
  deleteComment
};
