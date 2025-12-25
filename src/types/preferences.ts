/**
 * Copperline Golf - Unified Preferences Types
 * 
 * These types are shared across:
 * - Android App (React Native)
 * - iOS App (React Native)
 * - Web App (Next.js)
 * 
 * IMPORTANT: All platforms now use Firestore for preferences (not AsyncStorage)
 * This enables cross-platform sync.
 * 
 * DO NOT MODIFY without updating all platforms!
 */

// ============================================================================
// PREFERENCE TYPES
// ============================================================================

export type DistanceUnit = 'yards' | 'meters';
export type TemperatureUnit = 'fahrenheit' | 'celsius';
export type SpeedUnit = 'mph' | 'kph';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja';
export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface UnitsPreferences {
  distance: DistanceUnit;
  temperature: TemperatureUnit;
  speed: SpeedUnit;
}

export interface AppearancePreferences {
  theme: Theme;
  language: Language;
  fontSize: number;              // 12-24
  highContrast: boolean;
  reduceMotion: boolean;
}

export interface NotificationPreferences {
  courseRecommendations: boolean;
  weatherAlerts: boolean;
  practiceReminders: boolean;
  achievementAlerts: boolean;
  weeklyStats: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export interface DisplayPreferences {
  showLandingZones: boolean;
  showWindIndicator: boolean;
  showElevationChange: boolean;
  show3DFlyover: boolean;
  autoRotateMap: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: ProfileVisibility;
  shareStatistics: boolean;
  shareLocation: boolean;
}

export interface AccessibilityPreferences {
  voiceFeedback: boolean;
  screenReader: boolean;
}

export interface PreferencesDocument {
  userId: string;
  
  // Grouped preferences
  units: UnitsPreferences;
  appearance: AppearancePreferences;
  notifications: NotificationPreferences;
  display: DisplayPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
  
  // Custom shot names (user-created in Settings)
  customShotNames: string[];
  
  // Metadata
  createdAt: any;                // Firestore Timestamp
  updatedAt: any;                // Firestore Timestamp
  version: number;
}

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

export const DEFAULT_UNITS: UnitsPreferences = {
  distance: 'yards',
  temperature: 'fahrenheit',
  speed: 'mph',
};

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  theme: 'system',
  language: 'en',
  fontSize: 16,
  highContrast: false,
  reduceMotion: false,
};

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  courseRecommendations: true,
  weatherAlerts: true,
  practiceReminders: false,
  achievementAlerts: true,
  weeklyStats: true,
  pushEnabled: true,
  emailEnabled: false,
};

export const DEFAULT_DISPLAY: DisplayPreferences = {
  showLandingZones: true,
  showWindIndicator: true,
  showElevationChange: true,
  show3DFlyover: false,
  autoRotateMap: false,
};

export const DEFAULT_PRIVACY: PrivacyPreferences = {
  profileVisibility: 'private',
  shareStatistics: false,
  shareLocation: false,
};

export const DEFAULT_ACCESSIBILITY: AccessibilityPreferences = {
  voiceFeedback: true,
  screenReader: false,
};

export const DEFAULT_PREFERENCES: Omit<PreferencesDocument, 'userId' | 'createdAt' | 'updatedAt'> = {
  units: DEFAULT_UNITS,
  appearance: DEFAULT_APPEARANCE,
  notifications: DEFAULT_NOTIFICATIONS,
  display: DEFAULT_DISPLAY,
  privacy: DEFAULT_PRIVACY,
  accessibility: DEFAULT_ACCESSIBILITY,
  customShotNames: [],
  version: 1,
};

// ============================================================================
// OPTION CONSTANTS
// ============================================================================

export const DISTANCE_UNITS: { value: DistanceUnit; label: string }[] = [
  { value: 'yards', label: 'Yards' },
  { value: 'meters', label: 'Meters' },
];

export const TEMPERATURE_UNITS: { value: TemperatureUnit; label: string }[] = [
  { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
  { value: 'celsius', label: 'Celsius (°C)' },
];

export const SPEED_UNITS: { value: SpeedUnit; label: string }[] = [
  { value: 'mph', label: 'Miles per hour (mph)' },
  { value: 'kph', label: 'Kilometers per hour (kph)' },
];

export const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System Default' },
];

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
];

export const VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends Only' },
  { value: 'private', label: 'Private' },
];

export const FONT_SIZE_RANGE = {
  min: 12,
  max: 24,
  step: 2,
  default: 16,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create default preferences for a new user
 */
export function createDefaultPreferences(userId: string): PreferencesDocument {
  return {
    userId,
    ...DEFAULT_PREFERENCES,
    createdAt: new Date(),  // Will be converted to Firestore Timestamp on save
    updatedAt: new Date(),
  };
}

/**
 * Validate preferences document
 */
export function validatePreferences(prefs: Partial<PreferencesDocument>): string[] {
  const errors: string[] = [];
  
  // Units validation
  if (prefs.units) {
    if (prefs.units.distance && !['yards', 'meters'].includes(prefs.units.distance)) {
      errors.push('Invalid distance unit');
    }
    if (prefs.units.temperature && !['fahrenheit', 'celsius'].includes(prefs.units.temperature)) {
      errors.push('Invalid temperature unit');
    }
    if (prefs.units.speed && !['mph', 'kph'].includes(prefs.units.speed)) {
      errors.push('Invalid speed unit');
    }
  }
  
  // Appearance validation
  if (prefs.appearance) {
    if (prefs.appearance.theme && !['light', 'dark', 'system'].includes(prefs.appearance.theme)) {
      errors.push('Invalid theme');
    }
    if (prefs.appearance.fontSize && (prefs.appearance.fontSize < 12 || prefs.appearance.fontSize > 24)) {
      errors.push('Font size must be between 12 and 24');
    }
  }
  
  // Privacy validation
  if (prefs.privacy) {
    if (prefs.privacy.profileVisibility && !['public', 'friends', 'private'].includes(prefs.privacy.profileVisibility)) {
      errors.push('Invalid profile visibility');
    }
  }
  
  return errors;
}

/**
 * Merge partial preferences with defaults
 */
export function mergeWithDefaults(partial: Partial<PreferencesDocument>): PreferencesDocument {
  return {
    userId: partial.userId || '',
    units: { ...DEFAULT_UNITS, ...partial.units },
    appearance: { ...DEFAULT_APPEARANCE, ...partial.appearance },
    notifications: { ...DEFAULT_NOTIFICATIONS, ...partial.notifications },
    display: { ...DEFAULT_DISPLAY, ...partial.display },
    privacy: { ...DEFAULT_PRIVACY, ...partial.privacy },
    accessibility: { ...DEFAULT_ACCESSIBILITY, ...partial.accessibility },
    customShotNames: partial.customShotNames || [],
    createdAt: partial.createdAt || new Date(),
    updatedAt: new Date(),
    version: partial.version || 1,
  };
}

/**
 * Convert distance based on user preference
 */
export function convertDistance(yards: number, unit: DistanceUnit): number {
  if (unit === 'meters') {
    return Math.round(yards * 0.9144);
  }
  return yards;
}

/**
 * Convert temperature based on user preference
 */
export function convertTemperature(fahrenheit: number, unit: TemperatureUnit): number {
  if (unit === 'celsius') {
    return Math.round((fahrenheit - 32) * 5 / 9);
  }
  return fahrenheit;
}

/**
 * Convert speed based on user preference
 */
export function convertSpeed(mph: number, unit: SpeedUnit): number {
  if (unit === 'kph') {
    return Math.round(mph * 1.60934);
  }
  return mph;
}

/**
 * Get display string for distance with unit
 */
export function formatDistance(yards: number, unit: DistanceUnit): string {
  const value = convertDistance(yards, unit);
  return `${value} ${unit === 'yards' ? 'yds' : 'm'}`;
}

/**
 * Get display string for temperature with unit
 */
export function formatTemperature(fahrenheit: number, unit: TemperatureUnit): string {
  const value = convertTemperature(fahrenheit, unit);
  return `${value}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

/**
 * Get display string for speed with unit
 */
export function formatSpeed(mph: number, unit: SpeedUnit): string {
  const value = convertSpeed(mph, unit);
  return `${value} ${unit}`;
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migrate from old AsyncStorage format to new Firestore format
 * Used during app upgrade
 */
export interface OldAsyncStoragePreferences {
  units?: string;
  temperatureUnits?: string;
  theme?: string;
  courseRecommendations?: string;  // JSON boolean
  weatherAlerts?: string;          // JSON boolean
  practiceReminders?: string;      // JSON boolean
  achievementNotifications?: string; // JSON boolean
  fontSize?: string;
  highContrast?: string;           // JSON boolean
  voiceFeedback?: string;          // JSON boolean
  reduceMotion?: string;           // JSON boolean
  screenReader?: string;           // JSON boolean
}

export function migrateFromAsyncStorage(
  userId: string,
  oldPrefs: OldAsyncStoragePreferences
): PreferencesDocument {
  const parseBoolean = (val: string | undefined): boolean => {
    if (!val) return false;
    try {
      return JSON.parse(val) === true;
    } catch {
      return val === 'true';
    }
  };
  
  return {
    userId,
    units: {
      distance: (oldPrefs.units as DistanceUnit) || 'yards',
      temperature: (oldPrefs.temperatureUnits as TemperatureUnit) || 'fahrenheit',
      speed: 'mph',  // New field, default
    },
    appearance: {
      theme: (oldPrefs.theme as Theme) || 'system',
      language: 'en',  // New field, default
      fontSize: parseInt(oldPrefs.fontSize || '16', 10),
      highContrast: parseBoolean(oldPrefs.highContrast),
      reduceMotion: parseBoolean(oldPrefs.reduceMotion),
    },
    notifications: {
      courseRecommendations: parseBoolean(oldPrefs.courseRecommendations),
      weatherAlerts: parseBoolean(oldPrefs.weatherAlerts),
      practiceReminders: parseBoolean(oldPrefs.practiceReminders),
      achievementAlerts: parseBoolean(oldPrefs.achievementNotifications),
      weeklyStats: true,  // New field, default
      pushEnabled: true,  // New field, default
      emailEnabled: false,  // New field, default
    },
    display: DEFAULT_DISPLAY,  // All new fields
    privacy: DEFAULT_PRIVACY,  // All new fields
    accessibility: {
      voiceFeedback: parseBoolean(oldPrefs.voiceFeedback),
      screenReader: parseBoolean(oldPrefs.screenReader),
    },
    customShotNames: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };
}
