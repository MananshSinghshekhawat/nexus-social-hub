const Message = require('../models/Message');

const sendMessage = async (req, res) => {
    try {
        const { receiver, content } = req.body;
        const message = new Message({
            sender: req.user._id,
            receiver,
            content
        });
        await message.save();
        res.status(201).send(message);
    } catch (error) {
        res.status(400).send(error);
    }
};

const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        }).sort({ created_at: 1 });
        res.send(messages);
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

module.exports = { sendMessage, getMessages, markAsRead };
