'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useGPSTracking, GPSPosition } from './useGPSTracking';
import { useRecommendationTracking } from './useRecommendationTracking';

export type LandingArea = 'green' | 'fairway' | 'rough' | 'bunker' | 'water' | 'OB';
export type ShotOutcome = 'excellent' | 'good' | 'fair' | 'poor';

export interface ShotOutcomeParams {
  targetPosition?: GPSPosition;
  greenRadius?: number; // meters
  fairwayWidth?: number; // meters
}

/**
 * Hook for automatically tracking shot outcomes using GPS
 *
 * Combines GPS tracking with recommendation tracking to automatically
 * update shot outcomes when player position changes significantly.
 *
 * Usage:
 * ```tsx
 * const { startTracking, setCurrentRecommendation, assessOutcome } = useShotOutcomeTracking({
 *   greenRadius: 10, // 10 meter radius for green
 *   fairwayWidth: 30, // 30 meter width for fairway
 * });
 *
 * // After getting a recommendation
 * setCurrentRecommendation(eventId, targetGPSPosition);
 *
 * // Start GPS tracking
 * await startTracking();
 *
 * // Outcomes are automatically tracked when position changes
 * ```
 */
export function useShotOutcomeTracking(params: ShotOutcomeParams = {}) {
  const { greenRadius = 10, fairwayWidth = 30, targetPosition } = params;

  const currentRecommendationId = useRef<string | null>(null);
  const targetPos = useRef<GPSPosition | null>(targetPosition || null);

  const { updateOutcome } = useRecommendationTracking();
  const gpsTracking = useGPSTracking({
    enableHighAccuracy: true,
    minDistance: 10, // 10 meters minimum movement to detect shot
  });

  // Assess landing area based on distance to target
  const assessLandingArea = useCallback(
    (distanceToTarget: number): LandingArea => {
      if (distanceToTarget <= greenRadius) {
        return 'green';
      } else if (distanceToTarget <= greenRadius + fairwayWidth / 2) {
        return 'fairway';
      } else if (distanceToTarget <= greenRadius + fairwayWidth) {
        return 'rough';
      } else {
        return 'rough'; // Could be enhanced to detect water, bunkers, OB
      }
    },
    [greenRadius, fairwayWidth]
  );

  // Assess shot outcome based on landing area and distance
  const assessShotOutcome = useCallback(
    (landingArea: LandingArea, distanceToTarget: number): ShotOutcome => {
      if (landingArea === 'green') {
        return 'excellent';
      } else if (landingArea === 'fairway') {
        return distanceToTarget <= greenRadius + 10 ? 'good' : 'fair';
      } else if (landingArea === 'rough') {
        return distanceToTarget <= greenRadius + 20 ? 'fair' : 'poor';
      } else {
        return 'poor';
      }
    },
    [greenRadius]
  );

  // Convert meters to yards
  const metersToYards = (meters: number) => meters * 1.09361;

  // Track shot outcome
  const trackOutcome = useCallback(
    async (positionBefore: GPSPosition, positionAfter: GPSPosition) => {
      if (!currentRecommendationId.current) {
        console.log('[ShotOutcome] No recommendation ID set, skipping tracking');
        return;
      }

      if (!targetPos.current) {
        console.log('[ShotOutcome] No target position set, skipping tracking');
        return;
      }

      // Calculate distance to target
      const distanceToTarget = gpsTracking.calculateDistance(positionAfter, targetPos.current);
      const distanceYards = metersToYards(distanceToTarget);

      // Assess landing area and outcome
      const landingArea = assessLandingArea(distanceToTarget);
      const outcome = assessShotOutcome(landingArea, distanceToTarget);

      // Calculate actual distance traveled
      const actualDistance = gpsTracking.calculateDistance(positionBefore, positionAfter);
      const actualDistanceYards = metersToYards(actualDistance);

      console.log('[ShotOutcome] Tracking outcome:', {
        recommendationId: currentRecommendationId.current,
        distanceToTarget: distanceYards,
        landingArea,
        outcome,
        actualDistance: actualDistanceYards,
      });

      try {
        await updateOutcome({
          eventId: currentRecommendationId.current,
          positionBefore,
          positionAfter,
          landingArea,
          outcome,
          actualDistanceYards,
        });

        console.log('[ShotOutcome] Successfully tracked outcome');

        // Clear current recommendation after tracking
        currentRecommendationId.current = null;
        targetPos.current = null;
      } catch (error) {
        console.error('[ShotOutcome] Error tracking outcome:', error);
      }
    },
    [gpsTracking, assessLandingArea, assessShotOutcome, updateOutcome]
  );

  // Set current recommendation to track
  const setCurrentRecommendation = useCallback(
    (eventId: string, target?: GPSPosition) => {
      currentRecommendationId.current = eventId;
      if (target) {
        targetPos.current = target;
      }
      console.log('[ShotOutcome] Set recommendation for tracking:', eventId);
    },
    []
  );

  // Start tracking with outcome detection
  const startTracking = useCallback(async () => {
    const started = await gpsTracking.startTracking();
    if (started) {
      console.log('[ShotOutcome] GPS tracking started');
    }
    return started;
  }, [gpsTracking]);

  // Subscribe to shot detection
  useEffect(() => {
    const unsubscribe = gpsTracking.onShotDetected((from, to) => {
      console.log('[ShotOutcome] Shot detected, tracking outcome');
      trackOutcome(from, to);
    });

    return unsubscribe;
  }, [gpsTracking, trackOutcome]);

  return {
    ...gpsTracking,
    startTracking,
    setCurrentRecommendation,
    assessLandingArea,
    assessShotOutcome,
    currentRecommendationId: currentRecommendationId.current,
  };
}
