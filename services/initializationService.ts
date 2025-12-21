/**
 * User Initialization Service
 *
 * Handles first-time setup for new users:
 * - 14 default clubs
 * - 18 default shots
 * - Default preferences
 */

import { firebaseService } from './firebaseService';
import { generateDefaultClubs } from '@/src/types/clubs';
import { generateDefaultShots } from '@/src/types/shots';
import { DEFAULT_PREFERENCES, createDefaultPreferences } from '@/src/types/preferences';
import type { UserProfile } from '@/src/types/user';

export interface InitializationResult {
  clubsInitialized: boolean;
  shotsInitialized: boolean;
  preferencesInitialized: boolean;
  errors: string[];
}

/**
 * Initialize a new user with default clubs, shots, and preferences
 */
export async function initializeNewUser(
  userId: string,
  profile: UserProfile
): Promise<InitializationResult> {
  const result: InitializationResult = {
    clubsInitialized: false,
    shotsInitialized: false,
    preferencesInitialized: false,
    errors: [],
  };

  try {
    // 1. Initialize 14 default clubs
    console.log('[Init] Generating default clubs for user:', userId);
    const defaultClubs = generateDefaultClubs(
      profile.handicap,
      profile.typicalShotShape === 'draw' ? 'Draw' :
      profile.typicalShotShape === 'fade' ? 'Fade' : 'Square'
    );

    // Take first 14 clubs
    const clubs = defaultClubs.slice(0, 14);
    await firebaseService.updateUserClubs(userId, clubs);
    result.clubsInitialized = true;
    console.log('[Init] ✓ Initialized 14 default clubs');

    // 2. Initialize 18 default shots (6 shots per club for Driver, 7i, PW)
    console.log('[Init] Generating default shots for user:', userId);
    const defaultShots = generateDefaultShots(clubs);
    await firebaseService.updateUserShots(userId, defaultShots);
    result.shotsInitialized = true;
    console.log('[Init] ✓ Initialized 18 default shots');

    // 3. Initialize default preferences
    console.log('[Init] Creating default preferences for user:', userId);
    const preferences = createDefaultPreferences(userId);
    await firebaseService.updateUserPreferences(userId, preferences);
    result.preferencesInitialized = true;
    console.log('[Init] ✓ Initialized default preferences');

    console.log('[Init] ✓ User initialization complete:', userId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Init] Error during user initialization:', errorMessage);
    result.errors.push(errorMessage);
  }

  return result;
}

/**
 * Check if user needs initialization
 */
export async function checkUserInitialization(userId: string): Promise<{
  needsClubs: boolean;
  needsShots: boolean;
  needsPreferences: boolean;
}> {
  const [clubsDoc, shotsDoc, prefsDoc] = await Promise.all([
    firebaseService.getUserClubs(userId),
    firebaseService.getUserShots(userId),
    firebaseService.getUserPreferences(userId),
  ]);

  return {
    needsClubs: !clubsDoc || clubsDoc.clubs.length === 0,
    needsShots: !shotsDoc || shotsDoc.shots.length === 0,
    needsPreferences: !prefsDoc,
  };
}

/**
 * Initialize only missing data for existing users
 */
export async function initializeMissingData(
  userId: string,
  profile: UserProfile
): Promise<InitializationResult> {
  const result: InitializationResult = {
    clubsInitialized: false,
    shotsInitialized: false,
    preferencesInitialized: false,
    errors: [],
  };

  try {
    const needs = await checkUserInitialization(userId);

    // Initialize clubs if missing
    if (needs.needsClubs) {
      console.log('[Init] Initializing missing clubs for user:', userId);
      const defaultClubs = generateDefaultClubs(
        profile.handicap,
        profile.typicalShotShape === 'draw' ? 'Draw' :
        profile.typicalShotShape === 'fade' ? 'Fade' : 'Square'
      );
      await firebaseService.updateUserClubs(userId, defaultClubs.slice(0, 14));
      result.clubsInitialized = true;
    }

    // Initialize shots if missing
    if (needs.needsShots) {
      console.log('[Init] Initializing missing shots for user:', userId);
      const clubsDoc = await firebaseService.getUserClubs(userId);
      if (clubsDoc && clubsDoc.clubs.length > 0) {
        const defaultShots = generateDefaultShots(clubsDoc.clubs);
        await firebaseService.updateUserShots(userId, defaultShots);
        result.shotsInitialized = true;
      }
    }

    // Initialize preferences if missing
    if (needs.needsPreferences) {
      console.log('[Init] Initializing missing preferences for user:', userId);
      const preferences = createDefaultPreferences(userId);
      await firebaseService.updateUserPreferences(userId, preferences);
      result.preferencesInitialized = true;
    }

    console.log('[Init] ✓ Missing data initialization complete:', userId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Init] Error during missing data initialization:', errorMessage);
    result.errors.push(errorMessage);
  }

  return result;
}
