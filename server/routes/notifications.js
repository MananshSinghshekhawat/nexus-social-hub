const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getNotifications,
    getUnreadCount,
    markNotificationsRead
} = require('../controllers/notificationController');

// Notification routes
router.get('/', auth, getNotifications);
router.patch('/read', auth, markNotificationsRead);
router.get('/unread-count', auth, getUnreadCount);

module.exports = router;
