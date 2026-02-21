const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendMessage, getMessages, markAsRead } = require('../controllers/messageController');

router.post('/', auth, sendMessage);
router.get('/:userId', auth, getMessages);
router.patch('/read/:userId', auth, markAsRead);

module.exports = router;
