const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getConversations,
    getMessages,
    sendMessage,
    getNotifications,
    getUnreadCount,
    markNotificationsRead
} = require('../controllers/notificationController');

// Message routes
router.get('/conversations', auth, getConversations);
router.get('/messages/:otherUserId', auth, getMessages);
router.post('/messages', auth, sendMessage);

// Notification routes
router.get('/', auth, getNotifications);
router.patch('/read', auth, markNotificationsRead);
router.get('/unread-count', auth, getUnreadCount);

module.exports = router;
