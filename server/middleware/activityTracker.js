const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// Middleware to track user activities
const activityTracker = {
  // Log an activity
  async logActivity(userId, activityType, metadata = {}) {
    try {
      if (!userId) return;
      
      const activity = new ActivityLog({
        userId,
        activity_type: activityType,
        metadata
      });
      
      await activity.save();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },

  // Track login
  async trackLogin(userId) {
    try {
      await User.findByIdAndUpdate(userId, { 
        last_login: new Date(),
        session_start: new Date()
      });
      
      await this.logActivity(userId, 'login');
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  },

  // Track logout and calculate session duration
  async trackLogout(userId) {
    try {
      const user = await User.findById(userId);
      if (user && user.session_start) {
        const sessionDuration = Math.floor((Date.now() - user.session_start.getTime()) / 60000); // in minutes
        await User.findByIdAndUpdate(userId, {
          total_time_spent: (user.total_time_spent || 0) + sessionDuration,
          $unset: { session_start: 1 }
        });
        
        await this.logActivity(userId, 'logout', { duration: sessionDuration });
      }
    } catch (error) {
      console.error('Error tracking logout:', error);
    }
  },

  // Track post creation
  async trackPostCreated(userId, postId) {
    try {
      await this.logActivity(userId, 'post', { targetId: postId, targetType: 'post' });
    } catch (error) {
      console.error('Error tracking post:', error);
    }
  },

  // Track comment creation
  async trackCommentCreated(userId, commentId, postId) {
    try {
      await this.logActivity(userId, 'comment', { targetId: commentId, targetType: 'comment', postId });
    } catch (error) {
      console.error('Error tracking comment:', error);
    }
  },

  // Track like
  async trackLike(userId, targetId, targetType) {
    try {
      await this.logActivity(userId, 'like', { targetId, targetType });
    } catch (error) {
      console.error('Error tracking like:', error);
    }
  },

  // Track message
  async trackMessage(userId, recipientId) {
    try {
      await this.logActivity(userId, 'message', { targetId: recipientId, targetType: 'user' });
    } catch (error) {
      console.error('Error tracking message:', error);
    }
  },

  // Track follow
  async trackFollow(userId, targetUserId) {
    try {
      await this.logActivity(userId, 'follow', { targetId: targetUserId, targetType: 'user' });
    } catch (error) {
      console.error('Error tracking follow:', error);
    }
  },

  // Track unfollow
  async trackUnfollow(userId, targetUserId) {
    try {
      await this.logActivity(userId, 'unfollow', { targetId: targetUserId, targetType: 'user' });
    } catch (error) {
      console.error('Error tracking unfollow:', error);
    }
  }
};

module.exports = activityTracker;
