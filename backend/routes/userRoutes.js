const express = require('express');
const router = express.Router();
const {
  fetchAllUsers,
  modifyUserRole,
  fetchPlatformSummary,
  fetchTopBiddersLeaderboard
} = require('../controllers/userController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Public leaderboard aggregation
router.get('/leaderboard', fetchTopBiddersLeaderboard);

// Admin-only metrics and user management
router.get('/admin/summary', authenticate, authorizeRoles('admin'), fetchPlatformSummary);
router.get('/', authenticate, authorizeRoles('admin'), fetchAllUsers);
router.patch('/:id/role', authenticate, authorizeRoles('admin'), modifyUserRole);

module.exports = router;
