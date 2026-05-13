const Message = require('../models/Message');
const User = require('../models/User');
const activityTracker = require('../middleware/activityTracker');

const getConversations = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.user._id }, { receiver: req.user._id }]
        }).sort({ created_at: -1 });

        const convMap = new Map();
        messages.forEach((m) => {
            const otherId = m.sender.toString() === req.user._id.toString() ? m.receiver.toString() : m.sender.toString();
            if (!convMap.has(otherId)) {
                convMap.set(otherId, {
                    last_message: m.content,
                    last_time: m.created_at,
                    unread: (m.receiver.toString() === req.user._id.toString() && !m.read) ? 1 : 0,
                });
            } else if (m.receiver.toString() === req.user._id.toString() && !m.read) {
                const existing = convMap.get(otherId);
                existing.unread += 1;
            }
        });

        const userIds = [...convMap.keys()];
        const users = await User.find({ _id: { $in: userIds } }).select('username display_name avatar_url');

        const profileMap = new Map(users.map((u) => [u._id.toString(), u]));
        const conversations = userIds.map((uid) => ({
            user_id: uid,
            username: profileMap.get(uid)?.username,
            display_name: profileMap.get(uid)?.display_name,
            avatar_url: profileMap.get(uid)?.avatar_url,
            ...convMap.get(uid),
        }));

        res.send(conversations);
    } catch (error) {
        res.status(500).send(error);
    }
};

const getMessages = async (req, res) => {
    try {
        const otherUserId = req.params.otherUserId;
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: otherUserId },
                { sender: otherUserId, receiver: req.user._id }
            ]
        }).sort({ created_at: 1 });

        // Mark as read
        await Message.updateMany(
            { sender: otherUserId, receiver: req.user._id, read: false },
            { $set: { read: true } }
        );

        res.send(messages);
    } catch (error) {
        res.status(500).send(error);
    }
};

const sendMessage = async (req, res) => {
    try {
        const message = new Message({
            sender: req.user._id,
            receiver: req.body.receiverId,
            content: req.body.content
        });
        await message.save();

        // Track message activity
        await activityTracker.trackMessage(req.user._id, req.body.receiverId);

        // Send real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(req.body.receiverId.toString()).emit('receive_message', message);

            // Create persistent notification
            const Notification = require('../models/Notification');
            const notification = new Notification({
                user: req.body.receiverId,
                actor: req.user._id,
                type: 'message'
            });
            await notification.save();

            // Emit notification alert
            io.to(req.body.receiverId.toString()).emit('notification_received', {
                type: 'message',
                actor: {
                    _id: req.user._id,
                    username: req.user.username,
                    display_name: req.user.display_name,
                    avatar_url: req.user.avatar_url
                }
            });
        }
        res.status(201).send(message);
    } catch (error) {
        res.status(500).send(error);
    }
};

const markAsRead = async (req, res) => {
    try {
        await Message.updateMany(
            { sender: req.params.userId, receiver: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.send({ success: true });
    } catch (error) {
        res.status(500).send(error);
    }
};

module.exports = { getConversations, getMessages, sendMessage, markAsRead };
