const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Recipient
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The one who triggered it
    type: {
        type: String,
        required: true,
        enum: ['like', 'comment', 'follow', 'mention']
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Notification', notificationSchema);
