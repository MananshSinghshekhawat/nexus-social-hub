const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate('actor', 'username display_name avatar_url')
            .sort({ created_at: -1 })
            .limit(50);
        res.send(notifications);
    } catch (error) {
        res.status(500).send(error);
    }
};

const markNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.send({ message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).send(error);
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user._id, read: false });
        res.send({ count });
    } catch (error) {
        res.status(500).send(error);
    }
};

module.exports = { getNotifications, markNotificationsRead, getUnreadCount };
