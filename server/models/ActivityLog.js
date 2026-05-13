const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activity_type: { type: String, enum: ['post', 'comment', 'like', 'message', 'login', 'logout', 'follow', 'unfollow'], required: true },
    metadata: {
        targetId: { type: String }, // ID of post/comment/user being acted upon
        targetType: { type: String }, // 'post', 'comment', 'user', etc.
        duration: { type: Number }, // for logout activity, duration of session in minutes
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Index for efficient queries
activityLogSchema.index({ userId: 1, created_at: -1 });
activityLogSchema.index({ userId: 1, activity_type: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
