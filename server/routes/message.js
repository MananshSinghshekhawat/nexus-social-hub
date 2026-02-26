const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getConversations, getMessages, sendMessage, markAsRead } = require('../controllers/messageController');

router.get('/conversations', auth, getConversations);
router.get('/messages/:otherUserId', auth, getMessages);
router.post('/messages', auth, sendMessage);
router.patch('/read/:userId', auth, markAsRead);

module.exports = router;
