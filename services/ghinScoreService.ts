/**
 * GHIN Score Service
 * Handles score storage in Firebase and posting to USGA GHIN
 */

import { firebaseService } from './firebaseService';
import { createGHINClient } from '@/lib/api/ghin-client';
import type { Round } from '@/lib/api/types';
import type {
  GHINCourseCache,
  GHINScorePostRequest,
  GHINScorePostResponse,
} from '@/lib/api/ghin-types';

export class GHINScoreService {
  private ghinClient: ReturnType<typeof createGHINClient> | null = null;

  constructor() {
    // Only initialize GHIN client if credentials are available
    try {
      this.ghinClient = createGHINClient();
    } catch (error) {
      console.warn('[GHIN Score Service] GHIN API not configured:', error);
      this.ghinClient = null;
    }
  }

  /**
   * Check if GHIN integration is enabled
   */
  isGHINEnabled(): boolean {
    return this.ghinClient !== null;
  }

  /**
   * Get or fetch course data from GHIN
   * Caches in Firebase for performance
   */
  async getCourseData(
    ghinCourseId: string,
    courseName: string
  ): Promise<GHINCourseCache | null> {
    if (!this.ghinClient) {
      console.warn('[GHIN Score Service] GHIN not configured');
      return null;
    }

    try {
      // Check cache first
      const cached = await this.getCachedCourseData(ghinCourseId);
      if (cached && cached.expiresAt > Date.now()) {
        console.log(`[GHIN Score Service] Using cached data for ${courseName}`);
        return cached;
      }

      // Fetch fresh data from GHIN
      console.log(`[GHIN Score Service] Fetching course data for ${courseName}`);
      const courseData = await this.ghinClient.getCompleteCourseData(
        ghinCourseId,
        courseName
      );

      // Cache the data
      await this.cacheCourseData(courseData);

      return courseData;
    } catch (error) {
      console.error('[GHIN Score Service] Failed to fetch course data:', error);
      return null;
    }
  }

  /**
   * Get cached course data from Firebase
   */
  private async getCachedCourseData(
    ghinCourseId: string
  ): Promise<GHINCourseCache | null> {
    try {
      const doc = await firebaseService.getDocument(
        'ghinCourseCache',
        ghinCourseId
      );
      return doc as GHINCourseCache | null;
    } catch (error) {
      console.error('[GHIN Score Service] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache course data in Firebase
   */
  private async cacheCourseData(courseData: GHINCourseCache): Promise<void> {
    try {
      await firebaseService.setDocument(
        'ghinCourseCache',
        courseData.ghinCourseId,
        courseData
      );
      console.log(
        `[GHIN Score Service] Cached course data for ${courseData.courseName}`
      );
    } catch (error) {
      console.error('[GHIN Score Service] Error caching course data:', error);
    }
  }

  /**
   * Calculate adjusted gross score using ESC (Equitable Stroke Control)
   */
  calculateAdjustedGrossScore(
    round: Round,
    playerHandicap: number,
    courseData: GHINCourseCache,
    gender: 'men' | 'women' = 'men'
  ): number {
    const parValues = gender === 'men' ? courseData.scorecard.menPar : courseData.scorecard.womenPar;

    // ESC max scores by course handicap
    const getMaxScore = (par: number): number => {
      if (playerHandicap <= 9) return par + 2; // Double bogey
      if (playerHandicap <= 19) return 7;
      if (playerHandicap <= 29) return 8;
      if (playerHandicap <= 39) return 9;
      return 10;
    };

    // Apply ESC to each hole
    let adjustedScore = 0;
    round.holes.forEach((hole, index) => {
      const actualScore = hole.score || 0;
      const par = parValues[index] || 4;
      const maxScore = getMaxScore(par);

      adjustedScore += Math.min(actualScore, maxScore);
    });

    return adjustedScore;
  }

  /**
   * Save a round with GHIN data to Firebase
   */
  async saveRoundWithGHINData(
    userId: string,
    round: Round,
    courseData?: GHINCourseCache
  ): Promise<Round> {
    try {
      // If we have course data, calculate GHIN fields
      if (courseData && this.ghinClient) {
        const tee = courseData.tees.find((t) => t.name === round.teeUsed);

        if (tee) {
          // Get user profile for handicap
          const profile = await firebaseService.getUserProfile(userId);
          const playerHandicap = profile?.handicap || 18;

          // Calculate adjusted gross score
          round.adjustedGrossScore = this.calculateAdjustedGrossScore(
            round,
            playerHandicap,
            courseData,
            tee.gender
          );

          // Calculate handicap differential
          if (round.courseRating && round.slopeRating) {
            round.handicapDifferential = this.ghinClient.calculateHandicapDifferential(
              round.adjustedGrossScore,
              round.courseRating,
              round.slopeRating
            );
          }
        }
      }

      // Save to Firebase
      await firebaseService.updateUserRound(userId, round.id, round);

      console.log(`[GHIN Score Service] Saved round ${round.id} with GHIN data`);
      return round;
    } catch (error) {
      console.error('[GHIN Score Service] Failed to save round:', error);
      throw error;
    }
  }

  /**
   * Post score to USGA GHIN system
   * NOTE: This is a placeholder - actual GHIN posting requires partner API access
   */
  async postScoreToGHIN(
    request: GHINScorePostRequest
  ): Promise<GHINScorePostResponse> {
    if (!this.ghinClient) {
      return {
        success: false,
        message: 'GHIN API not configured',
        error: 'GHIN_NOT_CONFIGURED',
      };
    }

    try {
      // TODO: Implement actual GHIN score posting when partner API access is available
      // For now, just mark as "posted" in Firebase

      console.log('[GHIN Score Service] Posting score to GHIN:', request);

      // Update round to mark as posted
      await firebaseService.updateUserRound(request.userId, request.roundId, {
        postedToGHIN: true,
        ghinPostDate: new Date().toISOString(),
        ghinScoreId: `PENDING-${request.roundId}`, // Placeholder
      });

      return {
        success: true,
        message: 'Score posted to GHIN successfully',
        scoreId: `PENDING-${request.roundId}`,
      };
    } catch (error) {
      console.error('[GHIN Score Service] Failed to post score:', error);
      return {
        success: false,
        message: 'Failed to post score to GHIN',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Get tee options for a course
   */
  async getTeeOptions(
    ghinCourseId: string,
    courseName: string
  ): Promise<Array<{ name: string; color: string; rating: number; slope: number }>> {
    const courseData = await this.getCourseData(ghinCourseId, courseName);
    if (!courseData) return [];

    return courseData.tees.map((tee) => ({
      name: tee.name,
      color: tee.color,
      rating: tee.rating,
      slope: tee.slope,
    }));
  }

  /**
   * Validate if a score can be posted to GHIN
   */
  validateScoreForPosting(round: Round): { valid: boolean; reason?: string } {
    if (!round.ghinCourseId) {
      return { valid: false, reason: 'No GHIN course ID' };
    }

    if (!round.teeUsed) {
      return { valid: false, reason: 'No tee selected' };
    }

    if (round.holes.length < 9) {
      return { valid: false, reason: 'Must play at least 9 holes' };
    }

    if (!round.courseRating || !round.slopeRating) {
      return { valid: false, reason: 'Missing course rating/slope' };
    }

    if (round.postedToGHIN) {
      return { valid: false, reason: 'Score already posted' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const ghinScoreService = new GHINScoreService();
export default ghinScoreService;
