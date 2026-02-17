'use client';

import { useCallback } from 'react';
import { useRecommendationTracking } from './useRecommendationTracking';

export interface ClubDecisionParams {
  eventId: string;
  chosenClubId: string;
  chosenClubName: string;
  recommendedClubId: string;
  secondaryClubId?: string;
}

/**
 * Hook for tracking user club selection decisions after receiving recommendations
 *
 * Usage example:
 * ```tsx
 * const { trackDecision } = useClubDecisionTracking();
 *
 * // After user selects a club
 * await trackDecision({
 *   eventId: recommendationEventId,
 *   chosenClubId: 'club_7i',
 *   chosenClubName: '7-iron',
 *   recommendedClubId: 'club_6i',
 *   secondaryClubId: 'club_7i',
 * });
 * ```
 */
export function useClubDecisionTracking() {
  const { updateDecision } = useRecommendationTracking();

  const trackDecision = useCallback(
    async (params: ClubDecisionParams) => {
      const { eventId, chosenClubId, chosenClubName, recommendedClubId, secondaryClubId } = params;

      // Determine decision type
      let decisionType: 'followed-primary' | 'followed-secondary' | 'chose-different' | 'no-decision';

      if (chosenClubId === recommendedClubId) {
        decisionType = 'followed-primary';
      } else if (secondaryClubId && chosenClubId === secondaryClubId) {
        decisionType = 'followed-secondary';
      } else {
        decisionType = 'chose-different';
      }

      // Track the decision
      await updateDecision({
        eventId,
        decisionType,
        chosenShotId: `shot_${chosenClubId}`,
        chosenClubName,
        chosenShotName: 'Standard',
      });

      console.log('[ClubDecision] Tracked decision:', {
        eventId,
        decisionType,
        chosenClubName,
      });

      return decisionType;
    },
    [updateDecision]
  );

  return { trackDecision };
}
