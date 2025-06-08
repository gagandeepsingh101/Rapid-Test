const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createTestResult, getTestHistory, getTestResult } = require('../controller/test');
const upload = require('../middleware/upload');

const router = Router();

router.post('/', authenticateToken, upload.single('image'), createTestResult);
router.get('/', authenticateToken, getTestHistory);
router.get('/:id', authenticateToken, getTestResult);

module.exports = router;