import api from './api';

interface WellbeingUser {
  _id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  wellbeing_enabled: boolean;
  daily_limit?: number;
  total_time_spent: number;
}

export type ActivityBreakdown = Record<string, number>;

export interface WellbeingPeriodData {
  activities: number;
  breakdown: ActivityBreakdown;
  time_spent?: number;
  average_daily?: number;
}

export interface WellbeingStats {
  total_activities: number;
  login_streak: number;
  last_login?: Date;
  account_created?: Date;
}

export interface UserWellbeingData {
  user: WellbeingUser;
  today: WellbeingPeriodData;
  week: WellbeingPeriodData;
  month: WellbeingPeriodData;
  stats: WellbeingStats;
}

export interface AdminUserWellbeingData {
  user: {
    _id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url?: string;
    role: string;
    created_at: Date;
  };
  today: number;
  week: number;
  total_activities: number;
  total_time_spent: number;
  last_login?: Date;
}

// Get user's own wellbeing data
export const getUserWellbeingData = async (): Promise<UserWellbeingData> => {
  const response = await api.get('/wellbeing/me');
  return response.data;
};

// Update user's wellbeing settings
export const updateWellbeingSettings = async (
  wellbeing_enabled?: boolean,
  daily_limit?: number
): Promise<WellbeingUser> => {
  const response = await api.patch('/wellbeing/me/settings', {
    wellbeing_enabled,
    daily_limit
  });
  return response.data;
};

// Get all users' wellbeing data (admin only)
export const getAllUsersWellbeingData = async (): Promise<AdminUserWellbeingData[]> => {
  const response = await api.get('/wellbeing/admin/all');
  return response.data;
};

// Get specific user's wellbeing data (admin only)
export const getUserWellbeingDataAdmin = async (userId: string) => {
  const response = await api.get(`/wellbeing/admin/user/${userId}`);
  return response.data;
};
