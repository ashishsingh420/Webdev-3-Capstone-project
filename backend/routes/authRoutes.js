const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshAuthToken,
  logoutUser,
  getCurrentUserProfile
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAuthToken);
router.post('/logout', authenticate, logoutUser);
router.get('/me', authenticate, getCurrentUserProfile);

module.exports = router;
