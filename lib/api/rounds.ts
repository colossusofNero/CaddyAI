/**
 * Rounds API
 * Manages golf rounds and shot tracking
 */

import { ApiClient } from './client';
import type {
  Round,
  Shot,
  CreateRoundRequest,
  UpdateRoundRequest,
  ActiveRound,
  UserStatistics,
} from './types';
import { query, where, orderBy, limit } from 'firebase/firestore';

class RoundsApi extends ApiClient {
  private readonly COLLECTION = 'rounds';
  private readonly SHOTS_COLLECTION = 'shots';
  private readonly ACTIVE_ROUNDS_COLLECTION = 'activeRounds';

  /**
   * Get all rounds for the current user
   */
  async getRounds(limitCount = 50): Promise<Round[]> {
    try {
      const userId = this.getCurrentUserId();

      const rounds = await this.getDocuments<Round>(
        this.COLLECTION,
        [
          this.where('userId', '==', userId),
          orderBy('date', 'desc'),
          limit(limitCount)
        ]
      );

      console.log(`[RoundsAPI] Loaded ${rounds.length} rounds for user ${userId}`);
      return rounds;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Get a single round by ID
   */
  async getRound(roundId: string): Promise<Round | null> {
    try {
      const userId = this.getCurrentUserId();
      const round = await this.getDocument<Round>(this.COLLECTION, roundId);

      // Verify ownership
      if (round && round.userId !== userId) {
        throw this.createError(
          'permission-denied',
          'You do not have permission to access this round'
        );
      }

      return round;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Create a new round
   */
  async createRound(request: CreateRoundRequest): Promise<Round> {
    try {
      const userId = this.getCurrentUserId();
      const now = Date.now();

      // Calculate total score
      const score = request.holes.reduce((sum, hole) => sum + (hole.score || 0), 0);

      const round: Round = {
        id: '',
        userId,
        courseId: request.courseId,
        courseName: request.courseName,
        date: request.date,
        score,
        holes: request.holes,
        weather: request.weather,
        createdAt: now,
        updatedAt: now,
      };

      const createdRound = await this.createDocument<Round>(this.COLLECTION, round);

      console.log(`[RoundsAPI] Created round: ${createdRound.id} at ${createdRound.courseName}`);
      return createdRound;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Update an existing round
   */
  async updateRound(request: UpdateRoundRequest): Promise<void> {
    try {
      const userId = this.getCurrentUserId();

      // Verify ownership
      const existingRound = await this.getDocument<Round>(this.COLLECTION, request.id);
      if (!existingRound) {
        throw this.createError('not-found', 'Round not found');
      }
      if (existingRound.userId !== userId) {
        throw this.createError(
          'permission-denied',
          'You do not have permission to update this round'
        );
      }

      const updates: Partial<Round> = {
        ...request,
        updatedAt: Date.now(),
      };

      // Recalculate score if holes were updated
      if (updates.holes) {
        updates.score = updates.holes.reduce((sum, hole) => sum + (hole.score || 0), 0);
      }

      // Remove id from updates
      delete (updates as any).id;

      await this.updateDocument<Round>(this.COLLECTION, request.id, updates);

      console.log(`[RoundsAPI] Updated round: ${request.id}`);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Delete a round
   */
  async deleteRound(roundId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();

      // Verify ownership
      const existingRound = await this.getDocument<Round>(this.COLLECTION, roundId);
      if (!existingRound) {
        throw this.createError('not-found', 'Round not found');
      }
      if (existingRound.userId !== userId) {
        throw this.createError(
          'permission-denied',
          'You do not have permission to delete this round'
        );
      }

      // Delete all shots associated with this round
      await this.deleteRoundShots(roundId);

      // Delete the round
      await this.deleteDocument(this.COLLECTION, roundId);

      console.log(`[RoundsAPI] Deleted round: ${roundId}`);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Start a new active round
   */
  async startRound(
    courseId: string,
    courseName: string,
    holes: number = 18
  ): Promise<ActiveRound> {
    try {
      const userId = this.getCurrentUserId();
      const now = new Date().toISOString();

      const activeRound: ActiveRound = {
        id: userId, // Use userId as document ID to ensure only one active round
        userId,
        courseId,
        courseName,
        currentHole: 1,
        startedAt: now,
        holes: Array.from({ length: holes }, (_, i) => ({
          holeNumber: i + 1,
          par: 4, // Default par, can be updated
        })),
        lastActivity: Date.now(),
      };

      await this.createDocument<ActiveRound>(
        this.ACTIVE_ROUNDS_COLLECTION,
        activeRound,
        userId
      );

      console.log(`[RoundsAPI] Started active round at ${courseName}`);
      return activeRound;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Get active round for current user
   */
  async getActiveRound(): Promise<ActiveRound | null> {
    try {
      const userId = this.getCurrentUserId();
      return await this.getDocument<ActiveRound>(this.ACTIVE_ROUNDS_COLLECTION, userId);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Update active round
   */
  async updateActiveRound(updates: Partial<ActiveRound>): Promise<void> {
    try {
      const userId = this.getCurrentUserId();

      await this.updateDocument<ActiveRound>(
        this.ACTIVE_ROUNDS_COLLECTION,
        userId,
        {
          ...updates,
          lastActivity: Date.now(),
        }
      );

      console.log(`[RoundsAPI] Updated active round`);
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Complete active round and save as completed round
   */
  async completeActiveRound(): Promise<Round> {
    try {
      const userId = this.getCurrentUserId();
      const activeRound = await this.getActiveRound();

      if (!activeRound) {
        throw this.createError('not-found', 'No active round found');
      }

      // Create completed round
      const completedRound = await this.createRound({
        courseId: activeRound.courseId,
        courseName: activeRound.courseName,
        date: activeRound.startedAt,
        holes: activeRound.holes,
      });

      // Delete active round
      await this.deleteDocument(this.ACTIVE_ROUNDS_COLLECTION, userId);

      console.log(`[RoundsAPI] Completed active round: ${completedRound.id}`);
      return completedRound;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Add shot to a round
   */
  async addShot(shot: Omit<Shot, 'id' | 'createdAt'>): Promise<Shot> {
    try {
      const userId = this.getCurrentUserId();

      // Verify round ownership
      const round = await this.getDocument<Round>(this.COLLECTION, shot.roundId);
      if (!round) {
        throw this.createError('not-found', 'Round not found');
      }
      if (round.userId !== userId) {
        throw this.createError(
          'permission-denied',
          'You do not have permission to add shots to this round'
        );
      }

      const newShot: Shot = {
        ...shot,
        id: '',
        createdAt: Date.now(),
      };

      const createdShot = await this.createDocument<Shot>(this.SHOTS_COLLECTION, newShot);

      console.log(`[RoundsAPI] Added shot: ${createdShot.clubName} - ${createdShot.distance} yards`);
      return createdShot;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Get shots for a specific round
   */
  async getRoundShots(roundId: string): Promise<Shot[]> {
    try {
      const userId = this.getCurrentUserId();

      // Verify round ownership
      const round = await this.getDocument<Round>(this.COLLECTION, roundId);
      if (!round) {
        throw this.createError('not-found', 'Round not found');
      }
      if (round.userId !== userId) {
        throw this.createError(
          'permission-denied',
          'You do not have permission to access shots for this round'
        );
      }

      const shots = await this.getDocuments<Shot>(
        this.SHOTS_COLLECTION,
        [
          this.where('roundId', '==', roundId),
          orderBy('holeNumber', 'asc'),
          orderBy('shotNumber', 'asc')
        ]
      );

      return shots;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Delete all shots for a round
   */
  private async deleteRoundShots(roundId: string): Promise<void> {
    try {
      const shots = await this.getDocuments<Shot>(
        this.SHOTS_COLLECTION,
        [this.where('roundId', '==', roundId)]
      );

      await this.batchOperation(
        shots,
        shot => this.deleteDocument(this.SHOTS_COLLECTION, shot.id)
      );

      console.log(`[RoundsAPI] Deleted ${shots.length} shots for round ${roundId}`);
    } catch (error) {
      console.error('[RoundsAPI] Error deleting round shots:', error);
      // Don't throw - this is a cleanup operation
    }
  }

  /**
   * Calculate user statistics from rounds
   */
  async calculateStatistics(): Promise<UserStatistics> {
    try {
      const userId = this.getCurrentUserId();
      const rounds = await this.getRounds(100); // Get last 100 rounds

      if (rounds.length === 0) {
        return this.getDefaultStatistics(userId);
      }

      const totalRounds = rounds.length;
      const totalHoles = rounds.reduce((sum, r) => sum + r.holes.length, 0);
      const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
      const averageScore = Math.round(totalScore / totalRounds);
      const bestScore = Math.min(...rounds.map(r => r.score));

      // Calculate detailed stats
      let fairwaysHit = 0;
      let fairwaysTotal = 0;
      let greensInRegulation = 0;
      let greensTotal = 0;
      let totalPutts = 0;
      let puttsCount = 0;
      let birdies = 0;
      let pars = 0;
      let bogeys = 0;
      let doubleBogeys = 0;

      for (const round of rounds) {
        for (const hole of round.holes) {
          if (hole.fairwayHit !== undefined) {
            if (hole.fairwayHit) fairwaysHit++;
            fairwaysTotal++;
          }
          if (hole.greenInRegulation !== undefined) {
            if (hole.greenInRegulation) greensInRegulation++;
            greensTotal++;
          }
          if (hole.putts) {
            totalPutts += hole.putts;
            puttsCount++;
          }
          if (hole.score && hole.par) {
            const diff = hole.score - hole.par;
            if (diff === -1) birdies++;
            else if (diff === 0) pars++;
            else if (diff === 1) bogeys++;
            else if (diff === 2) doubleBogeys++;
          }
        }
      }

      const statistics: UserStatistics = {
        userId,
        totalRounds,
        totalHoles,
        averageScore,
        bestScore,
        currentHandicap: this.calculateHandicap(rounds),
        fairwaysHit,
        fairwaysHitPercentage: fairwaysTotal > 0 ? (fairwaysHit / fairwaysTotal) * 100 : 0,
        greensInRegulation,
        greensInRegulationPercentage: greensTotal > 0 ? (greensInRegulation / greensTotal) * 100 : 0,
        averagePutts: puttsCount > 0 ? totalPutts / puttsCount : 0,
        totalBirdies: birdies,
        totalPars: pars,
        totalBogeys: bogeys,
        totalDoubleBogeys: doubleBogeys,
        averageDriveDistance: 0, // Would need shot data
        lastUpdated: Date.now(),
      };

      return statistics;
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Calculate handicap using USGA formula (simplified)
   */
  private calculateHandicap(rounds: Round[]): number {
    if (rounds.length < 3) return 0;

    // Use best 8 of last 20 rounds for handicap calculation
    const recentRounds = rounds.slice(0, 20);
    const differentials = recentRounds
      .filter(r => r.handicapDifferential !== undefined)
      .map(r => r.handicapDifferential!);

    if (differentials.length < 3) {
      // Fallback: simple average over par
      const avgScore = rounds.slice(0, 20).reduce((sum, r) => sum + r.score, 0) / Math.min(rounds.length, 20);
      return Math.round((avgScore - 72) * 0.96); // Assuming par 72
    }

    differentials.sort((a, b) => a - b);
    const bestDifferentials = differentials.slice(0, Math.min(8, differentials.length));
    const avgDifferential = bestDifferentials.reduce((sum, d) => sum + d, 0) / bestDifferentials.length;

    return Math.round(avgDifferential * 0.96);
  }

  /**
   * Get default statistics for new users
   */
  private getDefaultStatistics(userId: string): UserStatistics {
    return {
      userId,
      totalRounds: 0,
      totalHoles: 0,
      averageScore: 0,
      bestScore: 0,
      currentHandicap: 0,
      fairwaysHit: 0,
      fairwaysHitPercentage: 0,
      greensInRegulation: 0,
      greensInRegulationPercentage: 0,
      averagePutts: 0,
      totalBirdies: 0,
      totalPars: 0,
      totalBogeys: 0,
      totalDoubleBogeys: 0,
      averageDriveDistance: 0,
      lastUpdated: Date.now(),
    };
  }
}

// Export singleton instance
export const roundsApi = new RoundsApi();
export default roundsApi;
