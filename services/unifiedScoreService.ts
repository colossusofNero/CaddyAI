/**
 * Unified Score Service
 *
 * Single service for writing scores to Firebase.
 * Uses the 'scores' collection (mobile app schema) for all writes.
 *
 * This replaces writing to the 'rounds' collection.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import type {
  FirebaseScore,
  FirebaseHoleScore,
  ScoreStats,
  ScoringTee,
  CourseInfo,
  RoundType,
} from '@/types/scores';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caddyai-aaabd',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

class UnifiedScoreService {
  private readonly COLLECTION = 'scores';

  /**
   * Create a new score (completed round)
   * This is the UNIFIED way to save rounds from web or mobile
   */
  async createScore(params: {
    userId: string;
    courseId: string;
    courseName: string;
    courseCity?: string;
    courseState?: string;
    date: string;
    roundType: RoundType;
    tee: ScoringTee;
    holes: Omit<FirebaseHoleScore, 'adjustedStrokes'>[];
  }): Promise<FirebaseScore> {
    try {
      // Calculate adjusted strokes and stats
      const holes = params.holes.map((hole) => ({
        ...hole,
        adjustedStrokes: Math.min(hole.strokes, this.getMaxScore(hole.par)),
      }));

      const stats = this.calculateStats(holes, params.tee);

      // Generate unique ID
      const scoreId = `score_${params.userId.substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const score: FirebaseScore = {
        id: scoreId,
        userId: params.userId,
        date: params.date,
        startTime: params.date,
        roundType: params.roundType,
        course: {
          id: params.courseId,
          name: params.courseName,
          city: params.courseCity,
          state: params.courseState,
        },
        tee: params.tee,
        holes,
        stats,
        ghinStatus: {
          eligible: this.isGHINEligible(params.roundType, holes),
          posted: false,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        version: 1,
      };

      // Write to unified 'scores' collection
      const scoreRef = doc(db, this.COLLECTION, scoreId);
      await setDoc(scoreRef, score);

      console.log(`[UnifiedScore] Created score ${scoreId} at ${params.courseName}`);
      return score;
    } catch (error) {
      console.error('[UnifiedScore] Error creating score:', error);
      throw error;
    }
  }

  /**
   * Update an existing score
   */
  async updateScore(
    userId: string,
    scoreId: string,
    updates: Partial<Omit<FirebaseScore, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    try {
      // Verify ownership
      const existing = await this.getScore(userId, scoreId);
      if (!existing) {
        throw new Error('Score not found');
      }
      if (existing.userId !== userId) {
        throw new Error('Unauthorized: Cannot update another user\'s score');
      }

      // If holes are being updated, recalculate stats
      let finalUpdates = { ...updates };
      if (updates.holes) {
        const holes = updates.holes.map((hole) => ({
          ...hole,
          adjustedStrokes: hole.adjustedStrokes || Math.min(hole.strokes, this.getMaxScore(hole.par)),
        }));

        const stats = this.calculateStats(holes, updates.tee || existing.tee);

        finalUpdates = {
          ...finalUpdates,
          holes,
          stats,
        };
      }

      const scoreRef = doc(db, this.COLLECTION, scoreId);
      await updateDoc(scoreRef, {
        ...finalUpdates,
        updatedAt: Timestamp.now(),
      });

      console.log(`[UnifiedScore] Updated score ${scoreId}`);
    } catch (error) {
      console.error('[UnifiedScore] Error updating score:', error);
      throw error;
    }
  }

  /**
   * Get a single score
   */
  async getScore(userId: string, scoreId: string): Promise<FirebaseScore | null> {
    try {
      const scoreRef = doc(db, this.COLLECTION, scoreId);
      const scoreDoc = await getDoc(scoreRef);

      if (!scoreDoc.exists()) {
        return null;
      }

      const score = scoreDoc.data() as FirebaseScore;

      // Verify ownership
      if (score.userId !== userId) {
        throw new Error('Unauthorized: Cannot access another user\'s score');
      }

      return score;
    } catch (error) {
      console.error('[UnifiedScore] Error getting score:', error);
      throw error;
    }
  }

  /**
   * Get all scores for a user
   */
  async getUserScores(
    userId: string,
    options?: {
      limit?: number;
      startDate?: string;
      endDate?: string;
      courseId?: string;
    }
  ): Promise<FirebaseScore[]> {
    try {
      const scoresRef = collection(db, this.COLLECTION);
      let q = query(
        scoresRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const snapshot = await getDocs(q);
      let scores = snapshot.docs.map((doc) => doc.data() as FirebaseScore);

      // Client-side filters
      if (options?.startDate) {
        scores = scores.filter((s) => s.date >= options.startDate!);
      }
      if (options?.endDate) {
        scores = scores.filter((s) => s.date <= options.endDate!);
      }
      if (options?.courseId) {
        scores = scores.filter((s) => s.course.id === options.courseId);
      }

      console.log(`[UnifiedScore] Loaded ${scores.length} scores for user`);
      return scores;
    } catch (error) {
      console.error('[UnifiedScore] Error getting user scores:', error);
      throw error;
    }
  }

  /**
   * Delete a score
   */
  async deleteScore(userId: string, scoreId: string): Promise<void> {
    try {
      // Verify ownership
      const existing = await this.getScore(userId, scoreId);
      if (!existing) {
        throw new Error('Score not found');
      }
      if (existing.userId !== userId) {
        throw new Error('Unauthorized: Cannot delete another user\'s score');
      }

      const scoreRef = doc(db, this.COLLECTION, scoreId);
      await deleteDoc(scoreRef);

      console.log(`[UnifiedScore] Deleted score ${scoreId}`);
    } catch (error) {
      console.error('[UnifiedScore] Error deleting score:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics from holes
   */
  private calculateStats(holes: FirebaseHoleScore[], tee: ScoringTee): ScoreStats {
    const grossScore = holes.reduce((sum, h) => sum + h.strokes, 0);
    const adjustedGrossScore = holes.reduce((sum, h) => sum + h.adjustedStrokes, 0);
    const totalPutts = holes.reduce((sum, h) => sum + h.putts, 0);
    const totalPenalties = holes.reduce((sum, h) => sum + h.penalties, 0);

    // Count fairways (only on par 4/5 holes)
    const drivingHoles = holes.filter((h) => h.par >= 4);
    const fairwaysHit = drivingHoles.filter((h) => h.fairwayHit).length;
    const fairwaysTotal = drivingHoles.length;

    // Count greens
    const greensInRegulation = holes.filter((h) => h.greenInRegulation).length;
    const greensTotal = holes.length;

    // Calculate score differential (simplified USGA formula)
    const scoreDifferential = ((113 / tee.slope) * (adjustedGrossScore - tee.rating)).toFixed(1);

    return {
      grossScore,
      adjustedGrossScore,
      scoreDifferential: parseFloat(scoreDifferential),
      scoreToPar: grossScore - tee.par,
      totalPutts,
      fairwaysHit,
      fairwaysTotal,
      greensInRegulation,
      greensTotal,
      penalties: totalPenalties,
      puttsPerHole: totalPutts / holes.length,
    };
  }

  /**
   * Get maximum score for a hole (ESC - Equitable Stroke Control)
   */
  private getMaxScore(par: number): number {
    // Simplified ESC: Par + 2
    return par + 2;
  }

  /**
   * Check if round is eligible for GHIN posting
   */
  private isGHINEligible(roundType: RoundType, holes: FirebaseHoleScore[]): boolean {
    // Must be 9 or 18 holes
    if (roundType !== '18' && roundType !== '9-front' && roundType !== '9-back') {
      return false;
    }

    // Must have all hole scores
    return holes.every((h) => h.strokes > 0);
  }
}

// Export singleton instance
export const unifiedScoreService = new UnifiedScoreService();
export default unifiedScoreService;
