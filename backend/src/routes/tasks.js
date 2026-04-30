const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const commentController = require('../controllers/commentController');
const { validateTask } = require('../middleware/validation');

router.get('/project/:projectId', auth, taskController.getTasks);
router.get('/assigned', auth, taskController.getAssignedTasks);
router.get('/:id', auth, taskController.getTaskById);
router.post('/project/:projectId', auth, validateTask, taskController.createTask);
router.put('/:id', auth, validateTask, taskController.updateTask);
router.patch('/:id/status', auth, taskController.updateMyTaskStatus);
router.delete('/:id', auth, taskController.deleteTask);

// Comments routes
router.get('/:taskId/comments', auth, commentController.getComments);
router.post('/:taskId/comments', auth, commentController.addComment);
router.delete('/comments/:commentId', auth, taskController.deleteTaskComment);

// Attachments routes
router.get('/:taskId/attachments', auth, taskController.getTaskAttachments);
router.post('/:taskId/attachments', auth, taskController.addTaskAttachment);
router.delete('/attachments/:attachmentId', auth, taskController.deleteTaskAttachment);

module.exports = router;
