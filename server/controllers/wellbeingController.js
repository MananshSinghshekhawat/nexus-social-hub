const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// Get user's wellbeing data
exports.getUserWellbeingData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    // Get all activities for this user
    const activities = await ActivityLog.find({ userId }).sort({ created_at: -1 });

    // Calculate statistics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const activitiesToday = activities.filter(a => a.created_at >= todayStart);
    const activitiesWeek = activities.filter(a => a.created_at >= weekStart);
    const activitiesMonth = activities.filter(a => a.created_at >= monthStart);

    // Count by type
    const countByType = (activityList) => {
      const counts = {};
      activityList.forEach(a => {
        counts[a.activity_type] = (counts[a.activity_type] || 0) + 1;
      });
      return counts;
    };

    // Calculate login streaks
    const loginActivities = activities.filter(a => a.activity_type === 'login').slice(0, 30);
    let loginStreak = 0;
    for (let i = 0; i < loginActivities.length; i++) {
      const currentDate = new Date(loginActivities[i].created_at);
      const nextDate = i + 1 < loginActivities.length ? new Date(loginActivities[i + 1].created_at) : null;
      
      if (nextDate) {
        const daysDiff = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          loginStreak++;
        } else {
          break;
        }
      } else {
        loginStreak++;
      }
    }

    const wellbeingData = {
      user: {
        _id: user._id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        wellbeing_enabled: user.wellbeing_enabled,
        daily_limit: user.daily_limit,
        total_time_spent: user.total_time_spent
      },
      today: {
        activities: activitiesToday.length,
        breakdown: countByType(activitiesToday),
        time_spent: user.total_time_spent
      },
      week: {
        activities: activitiesWeek.length,
        breakdown: countByType(activitiesWeek),
        average_daily: Math.round(activitiesWeek.length / 7)
      },
      month: {
        activities: activitiesMonth.length,
        breakdown: countByType(activitiesMonth),
        average_daily: Math.round(activitiesMonth.length / 30)
      },
      stats: {
        total_activities: activities.length,
        login_streak: loginStreak,
        last_login: user.last_login,
        account_created: user.created_at
      }
    };

    res.send(wellbeingData);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Update wellbeing settings
exports.updateWellbeingSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { wellbeing_enabled, daily_limit } = req.body;

    const updates = {};
    if (wellbeing_enabled !== undefined) updates.wellbeing_enabled = wellbeing_enabled;
    if (daily_limit !== undefined) updates.daily_limit = daily_limit;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    res.send(user);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Get all users' wellbeing data (admin only)
exports.getAllUsersWellbeingData = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ created_at: -1 });

    const usersWellbeingData = await Promise.all(
      users.map(async (user) => {
        const activities = await ActivityLog.find({ userId: user._id }).sort({ created_at: -1 });

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        const activitiesToday = activities.filter(a => a.created_at >= todayStart);
        const activitiesWeek = activities.filter(a => a.created_at >= weekStart);

        return {
          user: {
            _id: user._id,
            username: user.username,
            display_name: user.display_name,
            email: user.email,
            avatar_url: user.avatar_url,
            role: user.role,
            created_at: user.created_at
          },
          today: activitiesToday.length,
          week: activitiesWeek.length,
          total_activities: activities.length,
          total_time_spent: user.total_time_spent,
          last_login: user.last_login
        };
      })
    );

    res.send(usersWellbeingData);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Get specific user's wellbeing data (admin only)
exports.getUserWellbeingDataAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    const activities = await ActivityLog.find({ userId }).sort({ created_at: -1 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const countByType = (activityList) => {
      const counts = {};
      activityList.forEach(a => {
        counts[a.activity_type] = (counts[a.activity_type] || 0) + 1;
      });
      return counts;
    };

    const activitiesToday = activities.filter(a => a.created_at >= todayStart);
    const activitiesWeek = activities.filter(a => a.created_at >= weekStart);
    const activitiesMonth = activities.filter(a => a.created_at >= monthStart);

    const wellbeingData = {
      user: {
        _id: user._id,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role,
        wellbeing_enabled: user.wellbeing_enabled,
        daily_limit: user.daily_limit,
        total_time_spent: user.total_time_spent,
        created_at: user.created_at
      },
      today: {
        activities: activitiesToday.length,
        breakdown: countByType(activitiesToday)
      },
      week: {
        activities: activitiesWeek.length,
        breakdown: countByType(activitiesWeek)
      },
      month: {
        activities: activitiesMonth.length,
        breakdown: countByType(activitiesMonth)
      },
      recentActivities: activities.slice(0, 20)
    };

    res.send(wellbeingData);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
