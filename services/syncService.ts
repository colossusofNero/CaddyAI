/**
 * Sync Service
 *
 * Handles real-time synchronization between web app and mobile app
 * Uses Firestore's real-time listeners to keep data in sync
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import type { UserProfile, UserClubs, User } from '@/src/types/user';
import type { UserPreferences } from '@/src/types/preferences';
import type { FavoriteCourse, ActiveRound } from '@/src/types/course';

export interface SyncStatus {
  lastSync: number;
  isSyncing: boolean;
  error: string | null;
}

/**
 * Sync Callbacks
 * Register these callbacks to react to data changes
 */
export interface SyncCallbacks {
  onProfileUpdate?: (profile: UserProfile) => void;
  onClubsUpdate?: (clubs: UserClubs) => void;
  onPreferencesUpdate?: (preferences: UserPreferences) => void;
  onFavoritesUpdate?: (favorites: FavoriteCourse[]) => void;
  onActiveRoundUpdate?: (round: ActiveRound | null) => void;
  onError?: (error: Error) => void;
}

class SyncService {
  private listeners: Map<string, Unsubscribe> = new Map();
  private syncStatus: SyncStatus = {
    lastSync: Date.now(),
    isSyncing: false,
    error: null,
  };

  /**
   * Start syncing user data
   * Sets up real-time listeners for all user collections
   */
  startSync(userId: string, callbacks: SyncCallbacks): void {
    if (!db) {
      console.error('Firestore not initialized');
      return;
    }

    this.stopSync(); // Clean up existing listeners
    this.syncStatus.isSyncing = true;

    // Profile sync
    if (callbacks.onProfileUpdate) {
      const profileUnsub = onSnapshot(
        doc(db, 'profiles', userId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const profile: UserProfile = {
              userId: data.userId,
              dominantHand: data.dominantHand,
              handicap: data.handicap,
              typicalShotShape: data.typicalShotShape,
              height: data.height,
              curveTendency: data.curveTendency,
              yearsPlaying: data.yearsPlaying,
              playFrequency: data.playFrequency,
              driveDistance: data.driveDistance,
              strengthLevel: data.strengthLevel,
              improvementGoal: data.improvementGoal,
              updatedAt: data.updatedAt instanceof Timestamp
                ? data.updatedAt.toMillis()
                : data.updatedAt,
              createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toMillis()
                : data.createdAt,
            };
            if (callbacks.onProfileUpdate) {
              callbacks.onProfileUpdate(profile);
            }
            this.updateSyncStatus();
          }
        },
        (error) => {
          console.error('Profile sync error:', error);
          this.handleError(error, callbacks.onError);
        }
      );
      this.listeners.set('profile', profileUnsub);
    }

    // Clubs sync
    if (callbacks.onClubsUpdate) {
      const clubsUnsub = onSnapshot(
        doc(db, 'clubs', userId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const clubs: UserClubs = {
              userId: data.userId,
              clubs: data.clubs,
              updatedAt: data.updatedAt instanceof Timestamp
                ? data.updatedAt.toMillis()
                : data.updatedAt,
              createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toMillis()
                : data.createdAt,
            };
            if (callbacks.onClubsUpdate) {
              callbacks.onClubsUpdate(clubs);
            }
            this.updateSyncStatus();
          }
        },
        (error) => {
          console.error('Clubs sync error:', error);
          this.handleError(error, callbacks.onError);
        }
      );
      this.listeners.set('clubs', clubsUnsub);
    }

    // Preferences sync
    if (callbacks.onPreferencesUpdate) {
      const prefsUnsub = onSnapshot(
        doc(db, 'preferences', userId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const preferences: UserPreferences = {
              userId: data.userId,
              general: data.general,
              notifications: data.notifications,
              privacy: data.privacy,
              display: data.display,
              updatedAt: data.updatedAt instanceof Timestamp
                ? data.updatedAt.toMillis()
                : data.updatedAt,
              createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toMillis()
                : data.createdAt,
            };
            if (callbacks.onPreferencesUpdate) {
              callbacks.onPreferencesUpdate(preferences);
            }
            this.updateSyncStatus();
          }
        },
        (error) => {
          console.error('Preferences sync error:', error);
          this.handleError(error, callbacks.onError);
        }
      );
      this.listeners.set('preferences', prefsUnsub);
    }

    // Active round sync
    if (callbacks.onActiveRoundUpdate) {
      const roundUnsub = onSnapshot(
        doc(db, 'activeRounds', userId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const round: ActiveRound = {
              userId: data.userId,
              courseId: data.courseId,
              courseName: data.courseName,
              currentHole: data.currentHole,
              startedAt: data.startedAt instanceof Timestamp
                ? data.startedAt.toMillis()
                : data.startedAt,
              holes: data.holes,
            };
            if (callbacks.onActiveRoundUpdate) {
              callbacks.onActiveRoundUpdate(round);
            }
          } else {
            if (callbacks.onActiveRoundUpdate) {
              callbacks.onActiveRoundUpdate(null);
            }
          }
          this.updateSyncStatus();
        },
        (error) => {
          console.error('Active round sync error:', error);
          this.handleError(error, callbacks.onError);
        }
      );
      this.listeners.set('activeRound', roundUnsub);
    }
  }

  /**
   * Stop syncing user data
   * Unsubscribes from all listeners
   */
  stopSync(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
    this.syncStatus.isSyncing = false;
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force a manual sync
   * Useful for pull-to-refresh scenarios
   */
  async forceSync(userId: string): Promise<void> {
    // Firestore listeners auto-sync, so this just updates the timestamp
    this.syncStatus.lastSync = Date.now();
    console.log('Force sync triggered for user:', userId);
  }

  /**
   * Check if data is currently syncing
   */
  isSyncing(): boolean {
    return this.syncStatus.isSyncing;
  }

  /**
   * Private: Update sync status timestamp
   */
  private updateSyncStatus(): void {
    this.syncStatus.lastSync = Date.now();
    this.syncStatus.error = null;
  }

  /**
   * Private: Handle sync errors
   */
  private handleError(error: Error, onError?: (error: Error) => void): void {
    this.syncStatus.error = error.message;
    if (onError) {
      onError(error);
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
