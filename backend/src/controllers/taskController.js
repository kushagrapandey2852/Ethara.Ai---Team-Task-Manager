const { db } = require('../config/database');

const getTasks = (req, res) => {
  const { projectId } = req.params;

  try {
    // Check if user has access to this project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(projectId, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = db.prepare(`
      SELECT t.*, u.username as assignee_name, c.username as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.project_id = ?
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
    `).all(projectId);

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

const getTaskById = (req, res) => {
  const { id } = req.params;

  try {
    const task = db.prepare(`
      SELECT t.*, u.username as assignee_name, c.username as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `).get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

const createTask = (req, res) => {
  const { projectId } = req.params;
  const { title, description, status = 'pending', priority = 'medium', due_date, assignee_id } = req.body;

  try {
    // Check if user has access to this project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(projectId, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify assignee if provided
    if (assignee_id) {
      const assignee = db.prepare(
        'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
      ).get(projectId, assignee_id);

      if (!assignee) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || null, status, priority, due_date || null, projectId, assignee_id || null, req.user.id);

    const task = db.prepare(`
      SELECT t.*, u.username as assignee_name, c.username as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

const updateTask = (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date, assignee_id } = req.body;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify assignee if provided
    if (assignee_id) {
      const assignee = db.prepare(
        'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
      ).get(task.project_id, assignee_id);

      if (!assignee) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    db.prepare(`
      UPDATE tasks 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          due_date = ?,
          assignee_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title || null, description || null, status || null, priority || null, due_date || null, assignee_id || null, id);

    const updatedTask = db.prepare(`
      SELECT t.*, u.username as assignee_name, c.username as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `).get(id);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

const deleteTask = (req, res) => {
  const { id } = req.params;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the project
    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Get tasks assigned to the current user
const getAssignedTasks = (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, p.name as project_name, c.username as creator_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users c ON t.created_by = c.id
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
    `).all(req.user.id);

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assigned tasks' });
  }
};

// Update task status only (for members - restricted update)
const updateMyTaskStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Members can only update their own assigned tasks
    if (task.assignee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you' });
    }

    // Validate status
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare(`
      UPDATE tasks 
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = ?
      WHERE id = ?
    `).run(status, req.user.id, id);

    const updatedTask = db.prepare(`
      SELECT t.*, u.username as assignee_name, c.username as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `).get(id);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
};

// Get comments for a task
const getTaskComments = (req, res) => {
  const { taskId } = req.params;

  try {
    // Verify user has access to the task
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comments = db.prepare(`
      SELECT tc.*, u.username
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `).all(taskId);

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Add comment to a task
const addTaskComment = (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = db.prepare(`
      INSERT INTO task_comments (task_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(taskId, req.user.id, content.trim());

    const comment = db.prepare(`
      SELECT tc.*, u.username
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Delete a comment
const deleteTaskComment = (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment author or admin can delete
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    db.prepare('DELETE FROM task_comments WHERE id = ?').run(commentId);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// Get attachments for a task
const getTaskAttachments = (req, res) => {
  const { taskId } = req.params;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attachments = db.prepare(`
      SELECT ta.*, u.username
      FROM task_attachments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = ?
      ORDER BY ta.created_at DESC
    `).all(taskId);

    res.json(attachments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
};

// Add attachment record (simplified - would need file upload in production)
const addTaskAttachment = (req, res) => {
  const { taskId } = req.params;
  const { file_name, file_path, file_size, mime_type } = req.body;

  if (!file_name || !file_path) {
    return res.status(400).json({ error: 'File name and path are required' });
  }

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const membership = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = db.prepare(`
      INSERT INTO task_attachments (task_id, user_id, file_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(taskId, req.user.id, file_name, file_path, file_size || null, mime_type || null);

    const attachment = db.prepare(`
      SELECT ta.*, u.username
      FROM task_attachments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(attachment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add attachment' });
  }
};

// Delete an attachment
const deleteTaskAttachment = (req, res) => {
  const { attachmentId } = req.params;

  try {
    const attachment = db.prepare('SELECT * FROM task_attachments WHERE id = ?').get(attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Only the uploader or admin can delete
    if (attachment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own attachments' });
    }

    db.prepare('DELETE FROM task_attachments WHERE id = ?').run(attachmentId);
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAssignedTasks,
  updateMyTaskStatus,
  getTaskComments,
  addTaskComment,
  deleteTaskComment,
  getTaskAttachments,
  addTaskAttachment,
  deleteTaskAttachment
};
