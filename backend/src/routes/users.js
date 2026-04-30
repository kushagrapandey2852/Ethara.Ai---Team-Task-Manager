const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, adminOnly } = require('../middleware/auth');

// Allow all authenticated users to list users (for adding to projects)
// Only admin can see all details, regular users see basic info
router.get('/', auth, userController.getAllUsers);
router.get('/dashboard/member', auth, userController.getMemberDashboard);
router.get('/:id', auth, userController.getUserById);

// Profile update for all authenticated users
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
