const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth } = require('../middleware/auth');
const { validateProject, validateProjectMember } = require('../middleware/validation');

router.get('/', auth, projectController.getProjects);
router.get('/:id', auth, projectController.getProjectById);
router.get('/:id/members', auth, projectController.getMembers);
router.post('/', auth, validateProject, projectController.createProject);
router.put('/:id', auth, validateProject, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);
router.post('/:id/members', auth, validateProjectMember, projectController.addMember);
router.delete('/:id/members/:userId', auth, projectController.removeMember);

module.exports = router;
