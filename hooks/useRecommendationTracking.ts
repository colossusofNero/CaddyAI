/**
 * React Hook for Recommendation Tracking
 *
 * Makes it easy to track recommendations from any component
 */

import { useState, useCallback } from 'react';
import { recommendationTrackingService } from '@/services/recommendationTrackingService';
import type {
  RecommendationEvent,
  CreateRecommendationRequest,
  UpdateDecisionRequest,
  UpdateOutcomeRequest,
  RecommendationSource,
  DecisionType,
  GPSPosition,
} from '@/types/recommendationTracking';
import { useAuth } from '@/hooks/useAuth';

export function useRecommendationTracking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  /**
   * Track a new recommendation (optimizer run)
   *
   * Example usage - Optimizer Button:
   * ```typescript
   * const { trackRecommendation } = useRecommendationTracking();
   *
   * async function handleOptimizerClick() {
   *   const recommendations = calculateOptimalShots(...);
   *   const eventId = await trackRecommendation({
   *     source: 'optimizer-button',
   *     gpsPosition: currentGPS,
   *     recommendations: recommendations,
   *     ...
   *   });
   * }
   * ```
   */
  const trackRecommendation = useCallback(
    async (
      params: Omit<CreateRecommendationRequest, 'userId'>
    ): Promise<string | null> => {
      if (!user) {
        setError(new Error('User not authenticated'));
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const event = await recommendationTrackingService.createRecommendation({
          userId: user.uid,
          ...params,
        });

        setLastEventId(event.id);
        console.log('[Hook] Tracked recommendation:', event.id);
        return event.id;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to track recommendation');
        setError(error);
        console.error('[Hook] Error tracking recommendation:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Update user's decision on a recommendation
   *
   * Example usage - AI Agent:
   * ```typescript
   * const { updateDecision } = useRecommendationTracking();
   *
   * // After AI asks: "Which shot would you like to use?"
   * // User says: "I'll go with the 7-iron"
   * await updateDecision({
   *   eventId: currentEventId,
   *   decisionType: 'followed-primary',
   *   chosenClubName: '7-iron',
   *   conversationContext: {
   *     userResponse: "I'll go with the 7-iron",
   *     agentQuestion: "Which shot would you like to use?",
   *     confidence: 'high'
   *   }
   * });
   * ```
   */
  const updateDecision = useCallback(
    async (
      params: Omit<UpdateDecisionRequest, 'userId'>
    ): Promise<boolean> => {
      if (!user) {
        setError(new Error('User not authenticated'));
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        await recommendationTrackingService.updateDecision({
          userId: user.uid,
          ...params,
        });

        console.log('[Hook] Updated decision for:', params.eventId);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update decision');
        setError(error);
        console.error('[Hook] Error updating decision:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Update outcome after shot execution
   *
   * Example usage - GPS Tracking:
   * ```typescript
   * const { updateOutcome } = useRecommendationTracking();
   *
   * // After shot is hit and new GPS position is captured
   * await updateOutcome({
   *   eventId: previousEventId,
   *   positionAfter: newGPS,
   *   landingArea: 'green',
   *   outcome: 'excellent'
   * });
   * ```
   */
  const updateOutcome = useCallback(
    async (
      params: Omit<UpdateOutcomeRequest, 'userId'>
    ): Promise<boolean> => {
      if (!user) {
        setError(new Error('User not authenticated'));
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        await recommendationTrackingService.updateOutcome({
          userId: user.uid,
          ...params,
        });

        console.log('[Hook] Updated outcome for:', params.eventId);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update outcome');
        setError(error);
        console.error('[Hook] Error updating outcome:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Get user's recommendation history
   */
  const getRecommendations = useCallback(
    async (filters?: {
      roundId?: string;
      source?: RecommendationSource;
      limit?: number;
    }): Promise<RecommendationEvent[]> => {
      if (!user) {
        setError(new Error('User not authenticated'));
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        const events = await recommendationTrackingService.getRecommendations({
          userId: user.uid,
          ...filters,
        });

        return events;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get recommendations');
        setError(error);
        console.error('[Hook] Error getting recommendations:', error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Get user statistics
   */
  const getStats = useCallback(async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const stats = await recommendationTrackingService.getUserStats(user.uid);
      return stats;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get stats');
      setError(error);
      console.error('[Hook] Error getting stats:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    trackRecommendation,
    updateDecision,
    updateOutcome,
    getRecommendations,
    getStats,
    loading,
    error,
    lastEventId,
  };
}
