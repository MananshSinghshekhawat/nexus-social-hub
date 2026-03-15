const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    image_url: { type: String },
    video_url: { type: String },
    audio_name: { type: String, default: '' },
    post_type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'story', 'reel', 'video', 'shorts'],
        default: 'text'
    },
    filter: { type: String, default: 'none' },
    hls_url: { type: String },
    status: {
        type: String,
        enum: ['processing', 'ready', 'failed'],
        default: 'ready'
    },
    resolutions: [{ type: String }],
    media_metadata: {
        beat_markers: [{ type: Number }],
        ai_captions: [{
            text: { type: String },
            start: { type: Number },
            end: { type: Number }
        }]
    },
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    expires_at: { type: Date }, // For stories
    story_views: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewed_at: { type: Date, default: Date.now }
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Index for performance
postSchema.index({ user: 1, created_at: -1 });

module.exports = mongoose.model('Post', postSchema);
