/**
 * Realtime API
 * Real-time features using Firebase Realtime Database
 */

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import type { OnlineGolfer, ActiveRound } from './types';

/**
 * Subscribe to active golfers count
 * Returns the number of golfers currently playing
 */
export function subscribeToActiveGolfersCount(
  callback: (count: number) => void
): Unsubscribe {
  try {
    const activeRoundsRef = collection(db, 'activeRounds');
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes

    // Query for active rounds updated in the last 5 minutes
    const q = query(
      activeRoundsRef,
      where('lastActivity', '>', fiveMinutesAgo)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const count = snapshot.size;
        console.log(`[RealtimeAPI] Active golfers: ${count}`);
        callback(count);
      },
      (error) => {
        console.error('[RealtimeAPI] Error subscribing to active golfers:', error);
        callback(0);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('[RealtimeAPI] Error setting up active golfers subscription:', error);
    return () => {}; // Return no-op unsubscribe function
  }
}

/**
 * Subscribe to online golfers at a specific course
 */
export function subscribeToOnlineGolfersAtCourse(
  courseId: string,
  callback: (golfers: OnlineGolfer[]) => void
): Unsubscribe {
  try {
    const activeRoundsRef = collection(db, 'activeRounds');
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const q = query(
      activeRoundsRef,
      where('courseId', '==', courseId),
      where('lastActivity', '>', fiveMinutesAgo)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const golfers: OnlineGolfer[] = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();

          // Convert Timestamp to number if needed
          const lastActivity = data.lastActivity instanceof Timestamp
            ? data.lastActivity.toMillis()
            : data.lastActivity;

          golfers.push({
            userId: data.userId,
            displayName: data.displayName || 'Anonymous',
            photoURL: data.photoURL || null,
            currentHole: data.currentHole,
            courseId: data.courseId,
            courseName: data.courseName,
            lastActivity,
          });
        }

        console.log(`[RealtimeAPI] Online golfers at ${courseId}: ${golfers.length}`);
        callback(golfers);
      },
      (error) => {
        console.error('[RealtimeAPI] Error subscribing to course golfers:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('[RealtimeAPI] Error setting up course golfers subscription:', error);
    return () => {};
  }
}

/**
 * Subscribe to user's active round
 */
export function subscribeToActiveRound(
  userId: string,
  callback: (round: ActiveRound | null) => void
): Unsubscribe {
  try {
    const activeRoundsRef = collection(db, 'activeRounds');
    const q = query(activeRoundsRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(null);
          return;
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        // Convert Timestamp fields to numbers
        const activeRound: ActiveRound = {
          id: doc.id,
          userId: data.userId,
          courseId: data.courseId,
          courseName: data.courseName,
          currentHole: data.currentHole,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          holes: data.holes,
          lastActivity: data.lastActivity instanceof Timestamp
            ? data.lastActivity.toMillis()
            : data.lastActivity,
        };

        console.log(`[RealtimeAPI] Active round updated for user ${userId}`);
        callback(activeRound);
      },
      (error) => {
        console.error('[RealtimeAPI] Error subscribing to active round:', error);
        callback(null);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('[RealtimeAPI] Error setting up active round subscription:', error);
    return () => {};
  }
}

/**
 * Subscribe to rounds for a specific course
 * Useful for leaderboards and course activity
 */
export function subscribeToCoursReounds(
  courseId: string,
  callback: (count: number) => void
): Unsubscribe {
  try {
    const roundsRef = collection(db, 'rounds');
    const q = query(
      roundsRef,
      where('courseId', '==', courseId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const count = snapshot.size;
        console.log(`[RealtimeAPI] Total rounds at ${courseId}: ${count}`);
        callback(count);
      },
      (error) => {
        console.error('[RealtimeAPI] Error subscribing to course rounds:', error);
        callback(0);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('[RealtimeAPI] Error setting up course rounds subscription:', error);
    return () => {};
  }
}

/**
 * Helper: Update user's last activity
 * Should be called periodically during an active round
 */
export async function updateLastActivity(userId: string): Promise<void> {
  try {
    const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
    const activeRoundRef = doc(db, 'activeRounds', userId);

    await updateDoc(activeRoundRef, {
      lastActivity: Timestamp.now(),
    });
  } catch (error) {
    console.error('[RealtimeAPI] Error updating last activity:', error);
  }
}

/**
 * Realtime connection manager
 * Manages multiple subscriptions and cleanup
 */
export class RealtimeManager {
  private subscriptions: Map<string, Unsubscribe> = new Map();

  /**
   * Add a subscription with a unique key
   */
  subscribe(key: string, unsubscribe: Unsubscribe): void {
    // Unsubscribe existing subscription with same key
    this.unsubscribe(key);

    this.subscriptions.set(key, unsubscribe);
    console.log(`[RealtimeManager] Added subscription: ${key}`);
  }

  /**
   * Unsubscribe a specific subscription
   */
  unsubscribe(key: string): void {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
      console.log(`[RealtimeManager] Removed subscription: ${key}`);
    }
  }

  /**
   * Unsubscribe all subscriptions
   */
  unsubscribeAll(): void {
    console.log(`[RealtimeManager] Unsubscribing ${this.subscriptions.size} subscriptions`);

    for (const [key, unsubscribe] of this.subscriptions.entries()) {
      unsubscribe();
      console.log(`[RealtimeManager] Unsubscribed: ${key}`);
    }

    this.subscriptions.clear();
  }

  /**
   * Get number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();
