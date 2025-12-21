/**
 * CaddyAI - Unified Types Index
 * 
 * This barrel export provides all shared types for cross-platform consistency.
 * 
 * Usage:
 *   import { Club, Shot, PreferencesDocument } from '@/types';
 *   import { CLUB_LIST, SHOT_NAMES, DEFAULT_PREFERENCES } from '@/types';
 */

// ============================================================================
// CLUBS
// ============================================================================

export type {
  Club,
  ClubDocument,
  ClubFace,
  ClubShaft,
  ClubCategory,
  ClubDefinition,
  DefaultClubDistances,
} from './clubs';

export {
  CLUB_LIST,
  DEFAULT_CLUB_DISTANCES,
  getHandicapRange,
  generateDefaultClubs,
  calculateTotalDistance,
  canUseClubFromLie,
  getClubsByCategory,
} from './clubs';

// ============================================================================
// SHOTS
// ============================================================================

export type {
  Shot,
  ShotDocument,
  Takeback,
  ShotFace,
  ShotCategory,
  ShotName,
  LieType,
  DefaultShot,
} from './shots';

export {
  SHOT_NAMES,
  TAKEBACK_OPTIONS,
  FACE_OPTIONS,
  LIE_TYPES,
  LIE_TYPE_LABELS,
  DEFAULT_SHORT_GAME_SHOTS,
  generateShotId,
  calculateShotTotal,
  getShotCategory,
  generateDefaultShots,
  getShotsByClub,
  getShotsByCategory,
  findShotsForDistance,
  findShotsForLie,
  validateShot,
  createShot,
} from './shots';

// ============================================================================
// PREFERENCES
// ============================================================================

export type {
  PreferencesDocument,
  UnitsPreferences,
  AppearancePreferences,
  NotificationPreferences,
  DisplayPreferences,
  PrivacyPreferences,
  AccessibilityPreferences,
  DistanceUnit,
  TemperatureUnit,
  SpeedUnit,
  Theme,
  Language,
  ProfileVisibility,
  OldAsyncStoragePreferences,
} from './preferences';

export {
  DEFAULT_UNITS,
  DEFAULT_APPEARANCE,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_DISPLAY,
  DEFAULT_PRIVACY,
  DEFAULT_ACCESSIBILITY,
  DEFAULT_PREFERENCES,
  DISTANCE_UNITS,
  TEMPERATURE_UNITS,
  SPEED_UNITS,
  THEMES,
  LANGUAGES,
  VISIBILITY_OPTIONS,
  FONT_SIZE_RANGE,
  createDefaultPreferences,
  validatePreferences,
  mergeWithDefaults,
  convertDistance,
  convertTemperature,
  convertSpeed,
  formatDistance,
  formatTemperature,
  formatSpeed,
  migrateFromAsyncStorage,
} from './preferences';

// ============================================================================
// PLAYER PROFILE TYPES
// ============================================================================

export type HandDominance = 'right' | 'left';
export type NaturalShot = 'straight' | 'draw' | 'fade';
export type ShotHeight = 'low' | 'medium' | 'high';
export type PlayFrequency = 'rarely' | 'occasionally' | 'regularly' | 'frequently' | 'very-frequently';

export interface PlayerProfile {
  dominantHand: HandDominance;
  handicap: number;              // 0-54
  naturalShot: NaturalShot;
  shotHeight: ShotHeight;
  yardsOfCurve5i: number;        // Curve yards with 5 iron
}

export interface PlayerExperience {
  yearsPlaying: number;          // 0-50
  playFrequency: PlayFrequency;
}

export interface PlayerSkills {
  averageDrive: number;          // 100-350 yards
  strengthArea: string;
  improvementArea: string;
}

export interface PersonalInfo {
  name?: string;
  birthday?: string;
  phone?: string;
  address?: string;
}

export interface UserDocument {
  // Account
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any;                // Firestore Timestamp
  updatedAt: any;                // Firestore Timestamp
  
  // Onboarding status
  onboardingComplete: boolean;
  profileComplete: boolean;
  clubsComplete: boolean;
  shotsComplete: boolean;
  
  // Profile sections
  profile: PlayerProfile;
  experience: PlayerExperience;
  skills: PlayerSkills;
  personalInfo?: PersonalInfo;
}

// ============================================================================
// FIRESTORE COLLECTION PATHS
// ============================================================================

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  CLUBS: 'clubs',
  SHOTS: 'shots',
  PREFERENCES: 'preferences',
  ROUNDS: 'rounds',
  COURSES: 'courses',
} as const;

// ============================================================================
// VERSION
// ============================================================================

export const SCHEMA_VERSION = '1.0.0';
