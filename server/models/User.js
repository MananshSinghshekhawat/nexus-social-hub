const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    display_name: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    cover_url: { type: String, default: '' },
    website: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'moderator', 'user'], default: 'user' },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    // Digital Wellbeing fields
    wellbeing_enabled: { type: Boolean, default: true },
    daily_limit: { type: Number, default: null }, // optional usage limit in minutes
    last_login: { type: Date },
    total_time_spent: { type: Number, default: 0 }, // in minutes
    session_start: { type: Date }, // when current session started
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
