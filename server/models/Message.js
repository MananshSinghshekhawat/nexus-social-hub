const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Index for conversation performance
messageSchema.index({ sender: 1, receiver: 1, created_at: 1 });

module.exports = mongoose.model('Message', messageSchema);
