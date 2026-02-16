/**
 * Recommendation Tracking Service
 *
 * Handles all Firebase operations for tracking shot recommendations,
 * user decisions, and outcomes.
 *
 * Used by:
 * - Mobile app AI agent
 * - Shot optimizer button
 * - Web app (future)
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
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import type {
  RecommendationEvent,
  CreateRecommendationRequest,
  UpdateDecisionRequest,
  UpdateOutcomeRequest,
  RecommendationStats,
  RecommendationQuery,
  ShotRecommendation,
  GPSPosition,
} from '@/types/recommendationTracking';

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

class RecommendationTrackingService {
  private readonly COLLECTION = 'recommendations';

  /**
   * Create a new recommendation event
   * Call this every time the optimizer runs
   */
  async createRecommendation(
    request: CreateRecommendationRequest
  ): Promise<RecommendationEvent> {
    try {
      const now = Timestamp.now();
      const eventId = this.generateEventId(request.userId);

      // Assign ranks to recommendations (sort by EV if provided)
      const rankedRecommendations: ShotRecommendation[] = request.recommendations
        .sort((a, b) => (b.expectedValue || 0) - (a.expectedValue || 0))
        .map((rec, index) => ({
          ...rec,
          rank: index + 1,
        }));

      const event: RecommendationEvent = {
        id: eventId,
        userId: request.userId,
        roundId: request.roundId,
        holeNumber: request.holeNumber,
        shotNumber: request.shotNumber,
        timestamp: now,
        source: request.source,
        gpsPosition: request.gpsPosition,
        conditions: request.conditions,
        distanceToTarget: request.distanceToTarget,
        recommendations: rankedRecommendations,
        deviceType: request.deviceType,
        appVersion: request.appVersion,
        createdAt: now,
        updatedAt: now,
      };

      // Store in Firebase: recommendations/{userId}/events/{eventId}
      const eventRef = doc(
        db,
        this.COLLECTION,
        request.userId,
        'events',
        eventId
      );
      await setDoc(eventRef, this.serializeEvent(event));

      console.log(
        `[RecommendationTracking] Created event ${eventId} from ${request.source}`
      );

      // Update user stats
      await this.updateUserStats(request.userId);

      return event;
    } catch (error) {
      console.error('[RecommendationTracking] Error creating recommendation:', error);
      throw error;
    }
  }

  /**
   * Update user's decision on a recommendation
   * Call this when:
   * - AI agent gets a response from user
   * - User selects a shot after viewing recommendations
   */
  async updateDecision(request: UpdateDecisionRequest): Promise<void> {
    try {
      const eventRef = doc(
        db,
        this.COLLECTION,
        request.userId,
        'events',
        request.eventId
      );

      const userDecision = {
        decisionType: request.decisionType,
        timestamp: Date.now(),
        chosenShotId: request.chosenShotId,
        chosenClubName: request.chosenClubName,
        chosenShotName: request.chosenShotName,
        conversationContext: request.conversationContext,
        notes: request.notes,
      };

      await updateDoc(eventRef, {
        userDecision,
        updatedAt: Timestamp.now(),
      });

      console.log(
        `[RecommendationTracking] Updated decision for ${request.eventId}: ${request.decisionType}`
      );

      // Update user stats
      await this.updateUserStats(request.userId);
    } catch (error) {
      console.error('[RecommendationTracking] Error updating decision:', error);
      throw error;
    }
  }

  /**
   * Update outcome after shot is executed
   * Call this when:
   * - Next GPS position is captured
   * - Next optimizer run happens (use previous position)
   */
  async updateOutcome(request: UpdateOutcomeRequest): Promise<void> {
    try {
      const eventRef = doc(
        db,
        this.COLLECTION,
        request.userId,
        'events',
        request.eventId
      );

      // Get existing event to calculate distances
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) {
        throw new Error(`Event ${request.eventId} not found`);
      }

      const event = this.deserializeEvent(eventDoc.data() as any);

      // Calculate actual distance
      const actualDistance = this.calculateDistance(
        event.gpsPosition,
        request.positionAfter
      );

      const outcome = {
        positionBefore: event.gpsPosition,
        positionAfter: request.positionAfter,
        actualDistanceYards: actualDistance,
        distanceToTarget: this.calculateDistance(
          request.positionAfter,
          event.gpsPosition // Approximate - would need actual target position
        ),
        outcome: request.outcome,
        landingArea: request.landingArea,
        nextRecommendationId: request.nextRecommendationId,
      };

      await updateDoc(eventRef, {
        outcome,
        updatedAt: Timestamp.now(),
      });

      console.log(
        `[RecommendationTracking] Updated outcome for ${request.eventId}`
      );
    } catch (error) {
      console.error('[RecommendationTracking] Error updating outcome:', error);
      throw error;
    }
  }

  /**
   * Get recommendations for a user with optional filters
   */
  async getRecommendations(
    queryParams: RecommendationQuery
  ): Promise<RecommendationEvent[]> {
    try {
      const eventsRef = collection(
        db,
        this.COLLECTION,
        queryParams.userId,
        'events'
      );

      let q = query(eventsRef, orderBy('timestamp', 'desc'));

      // Apply filters
      if (queryParams.roundId) {
        q = query(q, where('roundId', '==', queryParams.roundId));
      }
      if (queryParams.source) {
        q = query(q, where('source', '==', queryParams.source));
      }
      if (queryParams.decisionType) {
        q = query(q, where('userDecision.decisionType', '==', queryParams.decisionType));
      }
      if (queryParams.startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(queryParams.startDate)));
      }
      if (queryParams.endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(queryParams.endDate)));
      }
      if (queryParams.limit) {
        q = query(q, limit(queryParams.limit));
      }

      const snapshot = await getDocs(q);
      const events: RecommendationEvent[] = [];

      snapshot.forEach((doc) => {
        events.push(this.deserializeEvent(doc.data() as any));
      });

      console.log(
        `[RecommendationTracking] Loaded ${events.length} recommendations`
      );

      return events;
    } catch (error) {
      console.error('[RecommendationTracking] Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Get a single recommendation event
   */
  async getRecommendation(
    userId: string,
    eventId: string
  ): Promise<RecommendationEvent | null> {
    try {
      const eventRef = doc(db, this.COLLECTION, userId, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        return null;
      }

      return this.deserializeEvent(eventDoc.data() as any);
    } catch (error) {
      console.error('[RecommendationTracking] Error getting recommendation:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<RecommendationStats | null> {
    try {
      const statsRef = doc(db, this.COLLECTION, userId, 'meta', 'stats');
      const statsDoc = await getDoc(statsRef);

      if (!statsDoc.exists()) {
        // Generate stats if they don't exist
        return await this.calculateUserStats(userId);
      }

      return statsDoc.data() as RecommendationStats;
    } catch (error) {
      console.error('[RecommendationTracking] Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Update user statistics (called after each event change)
   */
  private async updateUserStats(userId: string): Promise<void> {
    try {
      const stats = await this.calculateUserStats(userId);
      const statsRef = doc(db, this.COLLECTION, userId, 'meta', 'stats');
      await setDoc(statsRef, stats);
    } catch (error) {
      console.error('[RecommendationTracking] Error updating user stats:', error);
      // Don't throw - stats update is not critical
    }
  }

  /**
   * Calculate statistics from all user events
   */
  private async calculateUserStats(
    userId: string
  ): Promise<RecommendationStats> {
    try {
      const events = await this.getRecommendations({ userId, limit: 1000 });

      const stats: RecommendationStats = {
        userId,
        totalRecommendations: events.length,
        fromAIAgent: events.filter((e) => e.source === 'ai-agent').length,
        fromButton: events.filter((e) => e.source === 'optimizer-button').length,
        followedPrimary: events.filter(
          (e) => e.userDecision?.decisionType === 'followed-primary'
        ).length,
        followedSecondary: events.filter(
          (e) => e.userDecision?.decisionType === 'followed-secondary'
        ).length,
        choseDifferent: events.filter(
          (e) => e.userDecision?.decisionType === 'chose-different'
        ).length,
        noDecision: events.filter(
          (e) => e.userDecision?.decisionType === 'no-decision' || !e.userDecision
        ).length,
        adherenceRate: 0,
        lastUpdated: Timestamp.now(),
      };

      // Calculate adherence rate
      const withDecision = stats.followedPrimary + stats.followedSecondary + stats.choseDifferent;
      if (withDecision > 0) {
        stats.adherenceRate =
          ((stats.followedPrimary + stats.followedSecondary) / withDecision) * 100;
      }

      // Get first and last recommendation timestamps
      if (events.length > 0) {
        stats.firstRecommendation = events[events.length - 1].timestamp;
        stats.lastRecommendation = events[0].timestamp;
      }

      return stats;
    } catch (error) {
      console.error('[RecommendationTracking] Error calculating stats:', error);
      // Return empty stats on error
      return {
        userId,
        totalRecommendations: 0,
        fromAIAgent: 0,
        fromButton: 0,
        followedPrimary: 0,
        followedSecondary: 0,
        choseDifferent: 0,
        noDecision: 0,
        adherenceRate: 0,
        lastUpdated: Timestamp.now(),
      };
    }
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `rec_${userId.substring(0, 8)}_${timestamp}_${random}`;
  }

  /**
   * Calculate distance between two GPS positions (in yards)
   */
  private calculateDistance(pos1: GPSPosition, pos2: GPSPosition): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = (pos1.latitude * Math.PI) / 180;
    const lat2 = (pos2.latitude * Math.PI) / 180;
    const deltaLat = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
    const deltaLon = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = R * c;

    // Convert to yards
    return meters * 1.09361;
  }

  /**
   * Serialize event for Firebase storage
   */
  private serializeEvent(event: RecommendationEvent): any {
    return {
      ...event,
      timestamp: event.timestamp,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  /**
   * Deserialize event from Firebase
   */
  private deserializeEvent(data: any): RecommendationEvent {
    return {
      ...data,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp : Timestamp.fromMillis(data.timestamp),
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromMillis(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.fromMillis(data.updatedAt),
    } as RecommendationEvent;
  }
}

// Export singleton instance
export const recommendationTrackingService = new RecommendationTrackingService();
export default recommendationTrackingService;
