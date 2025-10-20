/**
 * Firebase Service
 *
 * Handles Firebase operations for courses and rounds
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import type { FavoriteCourse, ActiveRound } from '@/types/course';
import type { UserProfile, UserClubs } from '@/src/types/user';
import type { UserPreferences } from '@/src/types/preferences';

// Firebase configuration (from environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caddyai-aaabd',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

class FirebaseService {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(profileRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
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
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
      };
    } catch (error) {
      console.error('[Firebase] Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const now = Date.now();

      // Check if profile exists
      const existingDoc = await getDoc(profileRef);
      const profileData = {
        ...profile,
        updatedAt: now,
        createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
      };

      await setDoc(profileRef, profileData);
      console.log('[Firebase] User profile updated');
    } catch (error) {
      console.error('[Firebase] Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user clubs
   */
  async getUserClubs(userId: string): Promise<UserClubs | null> {
    try {
      const clubsRef = doc(db, 'clubs', userId);
      const docSnap = await getDoc(clubsRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        userId: data.userId,
        clubs: data.clubs,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
      };
    } catch (error) {
      console.error('[Firebase] Error getting user clubs:', error);
      throw error;
    }
  }

  /**
   * Update user clubs
   */
  async updateUserClubs(userId: string, clubs: import('@/src/types/user').ClubData[]): Promise<void> {
    try {
      const clubsRef = doc(db, 'clubs', userId);
      const now = Date.now();

      // Check if clubs exist
      const existingDoc = await getDoc(clubsRef);
      const clubsData = {
        userId,
        clubs,
        updatedAt: now,
        createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
      };

      await setDoc(clubsRef, clubsData);
      console.log('[Firebase] User clubs updated:', clubs.length, 'clubs');
    } catch (error) {
      console.error('[Firebase] Error updating user clubs:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const prefsRef = doc(db, 'preferences', userId);
      const docSnap = await getDoc(prefsRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        userId: data.userId,
        general: data.general,
        notifications: data.notifications,
        privacy: data.privacy,
        display: data.display,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
      };
    } catch (error) {
      console.error('[Firebase] Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    try {
      const prefsRef = doc(db, 'preferences', userId);
      const now = Date.now();

      // Check if preferences exist
      const existingDoc = await getDoc(prefsRef);
      const prefsData = {
        userId,
        ...preferences,
        updatedAt: now,
        createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
      };

      await setDoc(prefsRef, prefsData);
      console.log('[Firebase] User preferences updated');
    } catch (error) {
      console.error('[Firebase] Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Add course to favorites
   */
  async addFavoriteCourse(
    userId: string,
    courseId: string,
    courseName: string,
    location: string,
    imageUrl?: string
  ): Promise<void> {
    try {
      const docId = `${userId}_${courseId}`;
      const favoriteRef = doc(db, 'favoriteCourses', docId);

      const favoriteCourse: FavoriteCourse = {
        id: docId,
        userId,
        courseId,
        courseName,
        location,
        imageUrl,
        addedAt: new Date().toISOString(),
      };

      await setDoc(favoriteRef, favoriteCourse);
      console.log('[Firebase] Favorite course added:', courseId);
    } catch (error) {
      console.error('[Firebase] Error adding favorite course:', error);
      throw error;
    }
  }

  /**
   * Remove course from favorites
   */
  async removeFavoriteCourse(userId: string, courseId: string): Promise<void> {
    try {
      const docId = `${userId}_${courseId}`;
      const favoriteRef = doc(db, 'favoriteCourses', docId);
      await deleteDoc(favoriteRef);
      console.log('[Firebase] Favorite course removed:', courseId);
    } catch (error) {
      console.error('[Firebase] Error removing favorite course:', error);
      throw error;
    }
  }

  /**
   * Get user's favorite courses
   */
  async getFavoriteCourses(userId: string): Promise<FavoriteCourse[]> {
    try {
      const favoritesRef = collection(db, 'favoriteCourses');
      const q = query(
        favoritesRef,
        where('userId', '==', userId),
        orderBy('addedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const favorites = snapshot.docs.map(doc => doc.data() as FavoriteCourse);

      console.log('[Firebase] Loaded', favorites.length, 'favorite courses');
      return favorites;
    } catch (error) {
      console.error('[Firebase] Error getting favorite courses:', error);
      throw error;
    }
  }

  /**
   * Check if course is favorited
   */
  async isFavoriteCourse(userId: string, courseId: string): Promise<boolean> {
    try {
      const docId = `${userId}_${courseId}`;
      const favoriteRef = doc(db, 'favoriteCourses', docId);
      const docSnap = await getDoc(favoriteRef);
      return docSnap.exists();
    } catch (error) {
      console.error('[Firebase] Error checking favorite course:', error);
      return false;
    }
  }

  /**
   * Start a new round
   */
  async startRound(
    userId: string,
    courseId: string,
    courseName: string,
    holes: number
  ): Promise<string> {
    try {
      const roundRef = doc(db, 'activeRounds', userId);

      const activeRound: ActiveRound = {
        id: userId,
        userId,
        courseId,
        courseName,
        currentHole: 1,
        startedAt: new Date().toISOString(),
        holes: Array.from({ length: holes }, (_, i) => ({
          holeNumber: i + 1,
          par: 4, // Default, will be updated with actual scorecard
        })),
      };

      await setDoc(roundRef, activeRound);
      console.log('[Firebase] Round started:', courseId);
      return userId;
    } catch (error) {
      console.error('[Firebase] Error starting round:', error);
      throw error;
    }
  }

  /**
   * Get active round
   */
  async getActiveRound(userId: string): Promise<ActiveRound | null> {
    try {
      const roundRef = doc(db, 'activeRounds', userId);
      const docSnap = await getDoc(roundRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data() as ActiveRound;
    } catch (error) {
      console.error('[Firebase] Error getting active round:', error);
      throw error;
    }
  }

  /**
   * Update current hole
   */
  async updateCurrentHole(userId: string, holeNumber: number): Promise<void> {
    try {
      const roundRef = doc(db, 'activeRounds', userId);
      await setDoc(roundRef, { currentHole: holeNumber }, { merge: true });
      console.log('[Firebase] Current hole updated:', holeNumber);
    } catch (error) {
      console.error('[Firebase] Error updating current hole:', error);
      throw error;
    }
  }

  /**
   * Complete round
   */
  async completeRound(userId: string): Promise<void> {
    try {
      const roundRef = doc(db, 'activeRounds', userId);
      await setDoc(
        roundRef,
        { completedAt: new Date().toISOString() },
        { merge: true }
      );
      console.log('[Firebase] Round completed');
    } catch (error) {
      console.error('[Firebase] Error completing round:', error);
      throw error;
    }
  }

  /**
   * Delete active round
   */
  async deleteActiveRound(userId: string): Promise<void> {
    try {
      const roundRef = doc(db, 'activeRounds', userId);
      await deleteDoc(roundRef);
      console.log('[Firebase] Active round deleted');
    } catch (error) {
      console.error('[Firebase] Error deleting active round:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;
