'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Sparkles, Target } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';
import { recommendClubForDistance } from '@/services/recommendationService';
import { recordShotEvent, updateShotEventActualLanding } from '@/lib/shotEvents';
import { destinationPoint } from '@/lib/geo';
import { Club } from '@/types/club';
import { WeatherData } from '@/types/weather';

const LAST_EVENT_KEY = (userId: string, roundId: string) =>
  `copperline:lastOptimizerEvent:${userId}:${roundId}`;

interface ShotOptimizerButtonProps {
  distanceToTarget: number;
  availableClubs: Club[];
  weather: WeatherData;
  elevation?: number;
  shotDirection?: number;
  // Set to true when shotDirection is a real compass bearing (e.g. from a
  // target picker). When false, we skip writing predictedLanding because
  // shotDirection defaults to 0/north and would produce garbage data.
  bearingKnown?: boolean;
  roundId?: string;
  holeNumber?: number;
  shotNumber?: number;
  onRecommendationReceived?: (recommendations: any[]) => void;
}

/**
 * Shot Optimizer Button Component
 *
 * Demonstrates how to integrate recommendation tracking when user clicks
 * the optimizer button to get club recommendations
 */
export function ShotOptimizerButton({
  distanceToTarget,
  availableClubs,
  weather,
  elevation = 0,
  shotDirection = 0,
  bearingKnown = false,
  roundId,
  holeNumber,
  shotNumber,
  onRecommendationReceived,
}: ShotOptimizerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackRecommendation } = useRecommendationTracking();

  const handleOptimize = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Get current GPS position (if available)
      let gpsPosition: any = null;
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });

          gpsPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
        } catch (gpsError) {
          console.warn('[ShotOptimizer] GPS not available:', gpsError);
        }
      }

      // 2. Get recommendations from optimizer
      const primaryRec = recommendClubForDistance(
        distanceToTarget,
        availableClubs,
        weather,
        elevation,
        shotDirection
      );

      if (!primaryRec) {
        throw new Error('No suitable club found for this distance');
      }

      // Get second best option (next closest club)
      const otherClubs = availableClubs.filter(c => c.name !== primaryRec.club.name);
      const secondaryRec = recommendClubForDistance(
        distanceToTarget,
        otherClubs,
        weather,
        elevation,
        shotDirection
      );

      // Get third option if available
      const otherClubs2 = otherClubs.filter(c => c.name !== secondaryRec?.club.name);
      const tertiaryRec = recommendClubForDistance(
        distanceToTarget,
        otherClubs2,
        weather,
        elevation,
        shotDirection
      );

      // 3. Format recommendations for tracking
      const recommendations = [
        {
          rank: 1,
          shotId: `shot_${primaryRec.club.name}_primary`,
          clubId: primaryRec.club.name,
          clubName: primaryRec.club.name,
          shotName: 'Standard',
          takeback: 'Full',
          face: 'Square',
          carryYards: primaryRec.club.carryYards,
          rollYards: 10,
          totalYards: primaryRec.adjustedDistance,
          expectedValue: 0.90,
          adjustedCarry: primaryRec.adjustedDistance,
          reasoning: primaryRec.impact.recommendations.join('. ') || `Best club for ${distanceToTarget} yards`,
        },
      ];

      if (secondaryRec) {
        recommendations.push({
          rank: 2,
          shotId: `shot_${secondaryRec.club.name}_secondary`,
          clubId: secondaryRec.club.name,
          clubName: secondaryRec.club.name,
          shotName: 'Standard',
          takeback: 'Full',
          face: 'Square',
          carryYards: secondaryRec.club.carryYards,
          rollYards: 10,
          totalYards: secondaryRec.adjustedDistance,
          expectedValue: 0.80,
          adjustedCarry: secondaryRec.adjustedDistance,
          reasoning: 'Alternative club option',
        });
      }

      if (tertiaryRec) {
        recommendations.push({
          rank: 3,
          shotId: `shot_${tertiaryRec.club.name}_tertiary`,
          clubId: tertiaryRec.club.name,
          clubName: tertiaryRec.club.name,
          shotName: 'Standard',
          takeback: 'Full',
          face: 'Square',
          carryYards: tertiaryRec.club.carryYards,
          rollYards: 10,
          totalYards: tertiaryRec.adjustedDistance,
          expectedValue: 0.70,
          adjustedCarry: tertiaryRec.adjustedDistance,
          reasoning: 'Third option',
        });
      }

      // 4. Build the chain link to the previous optimizer call.
      //    On the second-and-later call of a round, the current origin GPS
      //    *is* the previous shot's actual landing — patch it back.
      const userId = getAuth().currentUser?.uid ?? null;
      const chainRoundId = roundId ?? null;
      let previousEventId: string | null = null;
      if (userId && chainRoundId && typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(LAST_EVENT_KEY(userId, chainRoundId));
        if (stored) {
          previousEventId = stored;
          if (gpsPosition) {
            // Fire-and-forget: write current origin onto the prior event.
            updateShotEventActualLanding(stored, {
              latitude: gpsPosition.latitude,
              longitude: gpsPosition.longitude,
            });
          }
        }
      }

      // 5. Compute predicted landing — only when we have GPS *and* a real bearing.
      const predictedLanding = gpsPosition && bearingKnown
        ? destinationPoint(
            { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude },
            shotDirection,
            primaryRec.adjustedDistance
          )
        : null;

      // 6. Log the raw optimizer invocation to shotEvents (one row per call)
      const newEventId = recordShotEvent({
        eventType: 'optimizer_run',
        roundId: chainRoundId,
        holeNumber: holeNumber ?? null,
        gpsPosition: gpsPosition
          ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude }
          : null,
        predictedLanding,
        previousEventId,
        payload: {
          shotNumber: shotNumber ?? null,
          distanceToTarget,
          elevation,
          shotDirection,
          bearingKnown,
          predictedCarryYards: primaryRec.adjustedDistance,
          recommendedClub: primaryRec.club.name,
          weather: {
            temperature: weather.temperature,
            windSpeed: weather.windSpeed,
            windDirection: weather.windDirection,
            humidity: weather.humidity,
            conditions: weather.conditions,
          },
          recommendations: recommendations.map(r => ({
            rank: r.rank,
            clubName: r.clubName,
            adjustedCarry: r.adjustedCarry,
            expectedValue: r.expectedValue,
          })),
        },
      });

      // 7. Stash the new event id so the *next* optimizer call can chain back.
      if (newEventId && userId && chainRoundId && typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_EVENT_KEY(userId, chainRoundId), newEventId);
      }

      // 8. Track the recommendation event (separate analytics collection)
      const eventId = await trackRecommendation({
        source: 'optimizer-button',
        roundId: roundId || `round_${Date.now()}`,
        holeNumber: holeNumber || 1,
        shotNumber: shotNumber || 1,
        gpsPosition: gpsPosition || {
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          timestamp: Date.now(),
        },
        conditions: {
          temperature: weather.temperature,
          windSpeed: weather.windSpeed,
          windDirection: weather.windDirection,
          humidity: weather.humidity,
          conditions: weather.conditions,
          elevationChange: elevation,
        },
        distanceToTarget,
        recommendations,
        deviceType: 'web',
        appVersion: '1.0.0',
      });

      console.log('[ShotOptimizer] Tracked recommendation:', eventId);

      // 9. Notify parent component
      if (onRecommendationReceived) {
        onRecommendationReceived(recommendations);
      }

    } catch (err) {
      console.error('[ShotOptimizer] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleOptimize}
        disabled={isLoading || availableClubs.length === 0}
        variant="primary"
        className="w-full gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Optimizing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Get AI Recommendation
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {!error && availableClubs.length === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <Target className="w-4 h-4 inline mr-1" />
          No clubs available. Please add your clubs first.
        </div>
      )}
    </div>
  );
}
