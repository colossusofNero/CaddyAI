/**
 * User Preferences Types
 *
 * Firebase Collection: preferences/{userId}
 * Syncs with mobile app preferences
 */

export interface UserPreferences {
  userId: string;

  // General Settings
  general: {
    unitSystem: 'yards' | 'meters';
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'es' | 'fr' | 'de' | 'ja';
    syncEnabled: boolean;
  };

  // Notifications
  notifications: {
    roundReminders: boolean;
    practiceReminders: boolean;
    achievementAlerts: boolean;
    weeklyStats: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
  };

  // Privacy
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    shareStatistics: boolean;
    shareLocation: boolean;
    allowFriendRequests: boolean;
  };

  // Display Options
  display: {
    showLandingZones: boolean;
    showWindIndicator: boolean;
    showElevationChange: boolean;
    show3DFlyover: boolean;
    autoRotateMap: boolean;
  };

  // Metadata
  updatedAt: number;
  createdAt: number;
}

export const defaultPreferences: Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  general: {
    unitSystem: 'yards',
    theme: 'system',
    language: 'en',
    syncEnabled: true,
  },
  notifications: {
    roundReminders: true,
    practiceReminders: false,
    achievementAlerts: true,
    weeklyStats: true,
    pushNotifications: true,
    emailNotifications: false,
  },
  privacy: {
    profileVisibility: 'friends',
    shareStatistics: true,
    shareLocation: false,
    allowFriendRequests: true,
  },
  display: {
    showLandingZones: true,
    showWindIndicator: true,
    showElevationChange: true,
    show3DFlyover: true,
    autoRotateMap: false,
  },
};
