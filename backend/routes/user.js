const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserProfile, updateUserProfile } = require('../controller/user');

const router = Router();

router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);

module.exports = router;