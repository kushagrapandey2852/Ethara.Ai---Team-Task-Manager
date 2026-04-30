const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

// Dashboard stats (for admin overview)
router.get('/dashboard', auth, analyticsController.getDashboardStats);

// Analytics/Reports data
router.get('/analytics', auth, analyticsController.getAnalytics);

// User management (admin only)
router.get('/users', auth, analyticsController.getAllUsers);
router.put('/users/:userId/role', auth, analyticsController.updateUserRole);
router.delete('/users/:userId', auth, analyticsController.deleteUser);

module.exports = router;
