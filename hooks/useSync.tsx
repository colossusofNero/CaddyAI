/**
 * useSync Hook
 *
 * React hook for real-time data synchronization with mobile app
 * Automatically syncs user data when component mounts
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { syncService, SyncStatus } from '@/services/syncService';
import type { UserProfile, UserClubs } from '@/src/types/user';
import type { PreferencesDocument } from '@/src/types/preferences';
import type { FavoriteCourse, ActiveRound } from '@/src/types/course';

interface UseSyncResult {
  profile: UserProfile | null;
  clubs: UserClubs | null;
  preferences: PreferencesDocument | null;
  favorites: FavoriteCourse[];
  activeRound: ActiveRound | null;
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
}

/**
 * Hook to sync user data with mobile app
 *
 * @example
 * const { profile, clubs, syncStatus, forceSync } = useSync();
 *
 * // Profile and clubs automatically update when mobile app changes them
 * // Call forceSync() for manual refresh (e.g., pull-to-refresh)
 */
export function useSync(): UseSyncResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clubs, setClubs] = useState<UserClubs | null>(null);
  const [preferences, setPreferences] = useState<PreferencesDocument | null>(null);
  const [favorites, setFavorites] = useState<FavoriteCourse[]>([]);
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getSyncStatus());

  useEffect(() => {
    if (!user) {
      // Clear data when user logs out
      setProfile(null);
      setClubs(null);
      setPreferences(null);
      setFavorites([]);
      setActiveRound(null);
      syncService.stopSync();
      return;
    }

    // Start syncing when user is authenticated
    syncService.startSync(user.uid, {
      onProfileUpdate: (updatedProfile) => {
        setProfile(updatedProfile);
        setSyncStatus(syncService.getSyncStatus());
      },
      onClubsUpdate: (updatedClubs) => {
        setClubs(updatedClubs);
        setSyncStatus(syncService.getSyncStatus());
      },
      onPreferencesUpdate: (updatedPreferences) => {
        setPreferences(updatedPreferences);
        setSyncStatus(syncService.getSyncStatus());
      },
      onActiveRoundUpdate: (updatedRound) => {
        setActiveRound(updatedRound);
        setSyncStatus(syncService.getSyncStatus());
      },
      onError: (error) => {
        console.error('Sync error:', error);
        setSyncStatus(syncService.getSyncStatus());
      },
    });

    // Cleanup on unmount
    return () => {
      syncService.stopSync();
    };
  }, [user]);

  const forceSync = async () => {
    if (user) {
      await syncService.forceSync(user.uid);
      setSyncStatus(syncService.getSyncStatus());
    }
  };

  return {
    profile,
    clubs,
    preferences,
    favorites,
    activeRound,
    syncStatus,
    forceSync,
  };
}

/**
 * Hook to check if data is synced with mobile app
 */
export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(syncService.getSyncStatus());

  useEffect(() => {
    // Update status every second
    const interval = setInterval(() => {
      setStatus(syncService.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
