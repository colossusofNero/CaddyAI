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
import type { PreferencesDocument } from '@/src/types/preferences';
import type { ClubDocument, Club } from '@/src/types/clubs';
import type { ShotDocument, Shot } from '@/src/types/shots';

// Firebase configuration (from environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Copperline Golf-aaabd',
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
   * Get user clubs (new unified schema)
   */
  async getUserClubs(userId: string): Promise<ClubDocument | null> {
    try {
      const clubsRef = doc(db, 'clubs', userId);
      const docSnap = await getDoc(clubsRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        userId: data.userId,
        clubs: data.clubs || [],
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
        version: data.version || 1,
      };
    } catch (error) {
      console.error('[Firebase] Error getting user clubs:', error);
      throw error;
    }
  }

  /**
   * Update user clubs (new unified schema)
   */
  async updateUserClubs(userId: string, clubs: Club[]): Promise<void> {
    try {
      const clubsRef = doc(db, 'clubs', userId);
      const now = Timestamp.now();

      // Check if clubs exist
      const existingDoc = await getDoc(clubsRef);
      const clubsData: ClubDocument = {
        userId,
        clubs,
        updatedAt: now,
        version: existingDoc.exists() ? (existingDoc.data().version || 1) : 1,
      };

      await setDoc(clubsRef, clubsData);
      console.log('[Firebase] User clubs updated:', clubs.length, 'clubs');
    } catch (error) {
      console.error('[Firebase] Error updating user clubs:', error);
      throw error;
    }
  }

  /**
   * Get user clubs (legacy format for backward compatibility)
   * @deprecated Use getUserClubs() which returns new ClubDocument format
   */
  async getUserClubsLegacy(userId: string): Promise<UserClubs | null> {
    try {
      const clubsRef = doc(db, 'clubs', userId);
      const docSnap = await getDoc(clubsRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      // Try to convert new format to old format if needed
      return {
        userId: data.userId,
        clubs: data.clubs,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
      };
    } catch (error) {
      console.error('[Firebase] Error getting legacy user clubs:', error);
      throw error;
    }
  }

  /**
   * Get user preferences (new unified schema)
   */
  async getUserPreferences(userId: string): Promise<PreferencesDocument | null> {
    try {
      const prefsRef = doc(db, 'preferences', userId);
      const docSnap = await getDoc(prefsRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        userId: data.userId,
        units: data.units,
        appearance: data.appearance,
        notifications: data.notifications,
        display: data.display,
        privacy: data.privacy,
        accessibility: data.accessibility,
        customShotNames: data.customShotNames || [],
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        version: data.version || 1,
      };
    } catch (error) {
      console.error('[Firebase] Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences (new unified schema)
   */
  async updateUserPreferences(
    userId: string,
    preferences: Omit<PreferencesDocument, 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    try {
      const prefsRef = doc(db, 'preferences', userId);
      const now = Timestamp.now();

      // Check if preferences exist
      const existingDoc = await getDoc(prefsRef);
      const prefsData: PreferencesDocument = {
        userId,
        ...preferences,
        updatedAt: now,
        createdAt: existingDoc.exists()
          ? (existingDoc.data().createdAt instanceof Timestamp ? existingDoc.data().createdAt : Timestamp.now())
          : now,
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

  /**
   * Get user shots (new unified schema)
   */
  async getUserShots(userId: string): Promise<ShotDocument | null> {
    try {
      const shotsRef = doc(db, 'shots', userId);
      const docSnap = await getDoc(shotsRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        userId: data.userId,
        shots: data.shots || [],
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
        version: data.version || 1,
      };
    } catch (error) {
      console.error('[Firebase] Error getting user shots:', error);
      throw error;
    }
  }

  /**
   * Update user shots (new unified schema)
   */
  async updateUserShots(userId: string, shots: Shot[]): Promise<void> {
    try {
      const shotsRef = doc(db, 'shots', userId);
      const now = Timestamp.now();

      // Check if shots exist
      const existingDoc = await getDoc(shotsRef);
      const shotsData: ShotDocument = {
        userId,
        shots,
        updatedAt: now,
        version: existingDoc.exists() ? (existingDoc.data().version || 1) : 1,
      };

      await setDoc(shotsRef, shotsData);
      console.log('[Firebase] User shots updated:', shots.length, 'shots');
    } catch (error) {
      console.error('[Firebase] Error updating user shots:', error);
      throw error;
    }
  }

  /**
   * Add a shot (new unified schema)
   */
  async addShot(userId: string, shot: Omit<Shot, 'id'>): Promise<string> {
    try {
      const shotsData = await this.getUserShots(userId);
      const shots = shotsData?.shots || [];

      const newShot: Shot = {
        ...shot,
        id: `shot_${shot.clubId.replace('club_', '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      shots.push(newShot);
      await this.updateUserShots(userId, shots);

      console.log('[Firebase] Shot added:', newShot.id);
      return newShot.id;
    } catch (error) {
      console.error('[Firebase] Error adding shot:', error);
      throw error;
    }
  }

  /**
   * Update a shot (new unified schema)
   */
  async updateShot(userId: string, shotId: string, updates: Partial<Omit<Shot, 'id'>>): Promise<void> {
    try {
      const shotsData = await this.getUserShots(userId);
      if (!shotsData) {
        throw new Error('Shots data not found');
      }

      const shotIndex = shotsData.shots.findIndex(s => s.id === shotId);
      if (shotIndex === -1) {
        throw new Error(`Shot not found: ${shotId}`);
      }

      shotsData.shots[shotIndex] = {
        ...shotsData.shots[shotIndex],
        ...updates,
        // Recalculate totalYards if carry or roll changed
        totalYards: updates.carryYards !== undefined || updates.rollYards !== undefined
          ? (updates.carryYards ?? shotsData.shots[shotIndex].carryYards) +
            (updates.rollYards ?? shotsData.shots[shotIndex].rollYards)
          : shotsData.shots[shotIndex].totalYards,
      };

      await this.updateUserShots(userId, shotsData.shots);
      console.log('[Firebase] Shot updated:', shotId);
    } catch (error) {
      console.error('[Firebase] Error updating shot:', error);
      throw error;
    }
  }

  /**
   * Delete a shot (new unified schema)
   */
  async deleteShot(userId: string, shotId: string): Promise<void> {
    try {
      const shotsData = await this.getUserShots(userId);
      if (!shotsData) {
        throw new Error('Shots data not found');
      }

      const filteredShots = shotsData.shots.filter(s => s.id !== shotId);
      await this.updateUserShots(userId, filteredShots);

      console.log('[Firebase] Shot deleted:', shotId);
    } catch (error) {
      console.error('[Firebase] Error deleting shot:', error);
      throw error;
    }
  }

  /**
   * Get all shots for a specific club (new unified schema)
   */
  async getClubShots(userId: string, clubId: string): Promise<Shot[]> {
    try {
      const shotsData = await this.getUserShots(userId);
      if (!shotsData) {
        return [];
      }

      return shotsData.shots.filter(s => s.clubId === clubId);
    } catch (error) {
      console.error('[Firebase] Error getting club shots:', error);
      throw error;
    }
  }

  /**
   * Get shot statistics for a club (new unified schema)
   */
  async getClubStatistics(userId: string, clubId: string): Promise<{
    averageDistance: number;
    minDistance: number;
    maxDistance: number;
    totalShots: number;
  }> {
    try {
      const shots = await this.getClubShots(userId, clubId);

      if (shots.length === 0) {
        return {
          averageDistance: 0,
          minDistance: 0,
          maxDistance: 0,
          totalShots: 0,
        };
      }

      const distances = shots.map(s => s.totalYards);
      const sum = distances.reduce((a, b) => a + b, 0);

      return {
        averageDistance: Math.round(sum / distances.length),
        minDistance: Math.min(...distances),
        maxDistance: Math.max(...distances),
        totalShots: shots.length,
      };
    } catch (error) {
      console.error('[Firebase] Error getting club statistics:', error);
      throw error;
    }
  }

  /**
   * Submit contact form
   */
  async submitContactForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    try {
      const contactRef = doc(collection(db, 'contactSubmissions'));
      const contactSubmission = {
        ...data,
        submittedAt: Timestamp.now(),
        status: 'new',
        read: false,
      };

      await setDoc(contactRef, contactSubmission);
      console.log('[Firebase] Contact form submitted:', contactRef.id);
    } catch (error) {
      console.error('[Firebase] Error submitting contact form:', error);
      throw error;
    }
  }

  /**
   * Get user's score history
   */
  async getUserScores(
    userId: string,
    options?: {
      limit?: number;
      startDate?: string;
      endDate?: string;
      courseId?: string;
      roundType?: string;
      postedOnly?: boolean;
    }
  ): Promise<any[]> {
    try {
      const scoresRef = collection(db, 'scores');
      let q = query(
        scoresRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const snapshot = await getDocs(q);
      const scores = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Apply client-side filters
      let filtered = scores;

      if (options?.startDate) {
        filtered = filtered.filter(s => s.date >= options.startDate!);
      }

      if (options?.endDate) {
        filtered = filtered.filter(s => s.date <= options.endDate!);
      }

      if (options?.courseId) {
        filtered = filtered.filter(s => s.course?.id === options.courseId);
      }

      if (options?.roundType) {
        filtered = filtered.filter(s => s.roundType === options.roundType);
      }

      if (options?.postedOnly) {
        filtered = filtered.filter(s => s.ghinStatus?.posted === true);
      }

      console.log('[Firebase] Loaded', filtered.length, 'scores for user');
      return filtered;
    } catch (error) {
      console.error('[Firebase] Error getting user scores:', error);
      throw error;
    }
  }

  /**
   * Get a single score by ID
   */
  async getScore(userId: string, scoreId: string): Promise<any | null> {
    try {
      const scoreRef = doc(db, 'scores', scoreId);
      const docSnap = await getDoc(scoreRef);

      if (!docSnap.exists()) {
        return null;
      }

      const score = docSnap.data();

      // Verify ownership
      if (score.userId !== userId) {
        throw new Error('Unauthorized access to score');
      }

      return {
        ...score,
        id: docSnap.id,
      };
    } catch (error) {
      console.error('[Firebase] Error getting score:', error);
      throw error;
    }
  }

  /**
   * Get user's active round (in progress)
   */
  async getActiveRound(userId: string): Promise<any | null> {
    try {
      const activeRoundRef = doc(db, 'activeRounds', userId);
      const docSnap = await getDoc(activeRoundRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        ...docSnap.data(),
        id: docSnap.id,
      };
    } catch (error) {
      console.error('[Firebase] Error getting active round:', error);
      throw error;
    }
  }

  /**
   * Get best score differentials for handicap calculation
   */
  async getBestDifferentials(userId: string, count: number = 20): Promise<any[]> {
    try {
      const scoresRef = collection(db, 'scores');
      const q = query(
        scoresRef,
        where('userId', '==', userId),
        orderBy('stats.scoreDifferential', 'asc'),
        limit(count)
      );

      const snapshot = await getDocs(q);
      const scores = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      console.log('[Firebase] Loaded', scores.length, 'best differentials');
      return scores;
    } catch (error) {
      console.error('[Firebase] Error getting best differentials:', error);
      throw error;
    }
  }

  /**
   * Get scores for a specific course
   */
  async getCourseScores(userId: string, courseId: string, limit?: number): Promise<any[]> {
    try {
      return await this.getUserScores(userId, {
        courseId,
        limit,
      });
    } catch (error) {
      console.error('[Firebase] Error getting course scores:', error);
      throw error;
    }
  }

  /**
   * Get course metadata
   */
  async getCourseMetadata(courseId: string): Promise<any | null> {
    try {
      const courseRef = doc(db, 'courses', courseId);
      const docSnap = await getDoc(courseRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        ...docSnap.data(),
        id: docSnap.id,
      };
    } catch (error) {
      console.error('[Firebase] Error getting course metadata:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;
