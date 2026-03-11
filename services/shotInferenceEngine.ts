/**
 * Shot Inference Engine
 *
 * Core algorithm: takes raw events collected during a hole
 * (optimizer runs, AI club selections, hole score) and infers a complete
 * shot-by-shot record with outcomes.
 *
 * KEY INSIGHT:
 *   Every optimizer run (after the tee) = where the PREVIOUS shot landed.
 *   The hole score + FIR/GIR/putts lets us infer what happened to shots
 *   that weren't followed by an optimizer run.
 */

import {
  OptimizerRunEvent,
  AIClubSelectionEvent,
  HoleScoreEvent,
  InferredShotRecord,
  HoleAnalytics,
  ShotType,
  ShotOutcome,
  RecommendationCompliance,
} from '../types/roundAnalytics.types';

// ─────────────────────────────────────────────
// HAVERSINE DISTANCE
// ─────────────────────────────────────────────

function haversineYards(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const meters = R * c;
  return meters * 1.09361; // convert to yards
}

// ─────────────────────────────────────────────
// MAIN INFERENCE ENGINE
// ─────────────────────────────────────────────

export interface InferenceInput {
  roundId: string;
  userId: string;
  holeNumber: number;
  par: number;
  optimizerEvents: OptimizerRunEvent[]; // sorted by timestamp ascending
  aiSelections: AIClubSelectionEvent[];  // sorted by timestamp ascending
  holeScore: HoleScoreEvent;
}

export interface InferenceResult {
  shots: InferredShotRecord[];
  holeAnalytics: HoleAnalytics;
}

/**
 * Primary inference function.
 * Call this when the user saves the hole score.
 */
export function inferHoleShots(input: InferenceInput): InferenceResult {
  const { roundId, userId, holeNumber, par, optimizerEvents, aiSelections, holeScore } = input;

  const sortedOptimizerEvents = [...optimizerEvents].sort((a, b) => a.timestamp - b.timestamp);
  const sortedAISelections = [...aiSelections].sort((a, b) => a.timestamp - b.timestamp);

  const score = holeScore.score;
  const putts = holeScore.putts;
  const gir = holeScore.greenInRegulation;
  const fir = holeScore.fairwayInRegulation;

  const shotsBeforePutting = score - putts;

  // Build a map: optimizerEventId → aiSelection
  const aiSelectionByOptimizerId = new Map<string, AIClubSelectionEvent>();
  for (const sel of sortedAISelections) {
    aiSelectionByOptimizerId.set(sel.optimizerEventId, sel);
  }

  const shots: InferredShotRecord[] = [];

  const numOptimizerShots = sortedOptimizerEvents.length;

  for (let i = 0; i < numOptimizerShots; i++) {
    const event = sortedOptimizerEvents[i];
    const nextEvent = sortedOptimizerEvents[i + 1] || null;
    const aiSel = aiSelectionByOptimizerId.get(event.eventId) || null;

    let actualDistanceTraveled: number | null = null;
    let endPosition = null;

    if (nextEvent) {
      endPosition = {
        latitude: nextEvent.gpsPosition.latitude,
        longitude: nextEvent.gpsPosition.longitude,
      };
      actualDistanceTraveled = haversineYards(
        event.gpsPosition.latitude, event.gpsPosition.longitude,
        nextEvent.gpsPosition.latitude, nextEvent.gpsPosition.longitude
      );
    } else if (i === numOptimizerShots - 1 && gir) {
      actualDistanceTraveled = event.shotInputs.distanceToPin;
    }

    const shotType = determineShotType(event, i, par);
    const outcome = determineOptimizerShotOutcome(
      event, i, numOptimizerShots, shotsBeforePutting, gir, fir, par
    );
    const compliance = determineCompliance(aiSel);
    const clubUsed = aiSel?.selectedClub ?? null;

    const carryDeltaYards =
      actualDistanceTraveled !== null && event.primaryRecommendation.expectedCarry > 0
        ? actualDistanceTraveled - event.primaryRecommendation.expectedCarry
        : null;

    shots.push({
      shotId: crypto.randomUUID(),
      roundId,
      userId,
      holeNumber,
      par,
      shotNumber: i + 1,
      timestamp: event.timestamp,

      startPosition: {
        latitude: event.gpsPosition.latitude,
        longitude: event.gpsPosition.longitude,
      },
      endPosition,
      actualDistanceTraveled,

      lie: event.shotInputs.lie,
      distanceToPin: event.shotInputs.distanceToPin,

      optimizerRan: true,
      primarySuggestion: event.primaryRecommendation.club,
      secondarySuggestion: event.secondaryRecommendation.club,
      optimizerExpectedCarry: event.primaryRecommendation.expectedCarry,

      clubUsed,
      recommendationCompliance: compliance,

      shotType,
      outcome,
      landedOnGreen: outcome === 'on_green',
      landedInFairway:
        outcome === 'in_fairway' ? true :
        outcome === 'in_rough' ? false : null,

      carryDeltaYards,

      holeScore: score,
      holePar: par,
      scoreRelativeToPar: score - par,
    });
  }

  // Infer untracked shots (chips, etc.) from score math
  const untrackedShotCount = shotsBeforePutting - numOptimizerShots;

  if (untrackedShotCount > 0) {
    for (let j = 0; j < untrackedShotCount; j++) {
      const shotNumber = numOptimizerShots + j + 1;
      const isLastUntrackedShot = j === untrackedShotCount - 1;
      const outcome: ShotOutcome = isLastUntrackedShot ? 'chip_on' : 'missed_green';
      const shotType: ShotType = untrackedShotCount === 1 ? 'chip' : j === 0 ? 'pitch' : 'chip';

      shots.push({
        shotId: crypto.randomUUID(),
        roundId,
        userId,
        holeNumber,
        par,
        shotNumber,
        timestamp: holeScore.timestamp - (untrackedShotCount - j) * 60000,

        startPosition: null,
        endPosition: null,
        actualDistanceTraveled: null,

        lie: 'Unknown',
        distanceToPin: 0,

        optimizerRan: false,
        primarySuggestion: null,
        secondarySuggestion: null,
        optimizerExpectedCarry: null,

        clubUsed: null,
        recommendationCompliance: 'no_ai_used',

        shotType,
        outcome,
        landedOnGreen: isLastUntrackedShot,
        landedInFairway: null,

        carryDeltaYards: null,

        holeScore: score,
        holePar: par,
        scoreRelativeToPar: score - par,
      });
    }
  }

  const holeAnalytics = buildHoleAnalytics(shots, holeScore, par);
  return { shots, holeAnalytics };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function determineShotType(
  event: OptimizerRunEvent,
  index: number,
  _par: number
): ShotType {
  if (event.shotInputs.lie === 'Tee' || index === 0) return 'tee';
  if (event.shotInputs.lie === 'Sand') return 'recovery';
  if (event.shotInputs.lie === 'Recovery') return 'recovery';

  const dist = event.shotInputs.distanceToPin;
  if (dist <= 30) return 'chip';
  if (dist <= 80) return 'pitch';

  return 'fairway';
}

function determineOptimizerShotOutcome(
  _event: OptimizerRunEvent,
  index: number,
  totalOptimizerShots: number,
  shotsBeforePutting: number,
  gir: boolean,
  fir: boolean | null,
  par: number
): ShotOutcome {
  const isLastOptimizerShot = index === totalOptimizerShots - 1;
  const isFirstShot = index === 0;

  if (isFirstShot && par >= 4) {
    if (fir === true) return 'in_fairway';
    if (fir === false) return 'in_rough';
    return 'unknown';
  }

  if (isLastOptimizerShot) {
    const untrackedShots = shotsBeforePutting - totalOptimizerShots;
    if (untrackedShots === 0) {
      return gir ? 'on_green' : 'missed_green';
    }
    return 'missed_green';
  }

  return 'unknown';
}

function determineCompliance(
  aiSel: AIClubSelectionEvent | null
): RecommendationCompliance {
  if (!aiSel) return 'no_ai_used';
  if (aiSel.followedPrimary) return 'followed_primary';
  if (aiSel.followedSecondary) return 'followed_secondary';
  return 'overrode';
}

function buildHoleAnalytics(
  shots: InferredShotRecord[],
  holeScore: HoleScoreEvent,
  par: number
): HoleAnalytics {
  const shotsWithAI = shots.filter(s => s.recommendationCompliance !== 'no_ai_used');
  const shotsFollowedAI = shots.filter(
    s =>
      s.recommendationCompliance === 'followed_primary' ||
      s.recommendationCompliance === 'followed_secondary'
  );
  const shotsOverrodeAI = shots.filter(s => s.recommendationCompliance === 'overrode');

  const carryDeltas = shots
    .map(s => s.carryDeltaYards)
    .filter((d): d is number => d !== null);

  const avgCarryDelta =
    carryDeltas.length > 0
      ? carryDeltas.reduce((a, b) => a + b, 0) / carryDeltas.length
      : null;

  const chipShots = shots.filter(
    s => s.shotType === 'chip' || s.shotType === 'pitch' || s.outcome === 'chip_on'
  );

  return {
    roundId: holeScore.roundId,
    holeNumber: holeScore.holeNumber,
    par,
    score: holeScore.score,

    shots,
    totalShots: holeScore.score,

    fairwayHit: holeScore.fairwayInRegulation,
    greenInRegulation: holeScore.greenInRegulation,
    putts: holeScore.putts,
    chipShotsNeeded: chipShots.length,
    penaltyStrokes: holeScore.penaltyStrokes,

    shotsWithAI: shotsWithAI.length,
    shotsFollowedAI: shotsFollowedAI.length,
    shotsOverrodeAI: shotsOverrodeAI.length,
    complianceRate:
      shotsWithAI.length > 0 ? shotsFollowedAI.length / shotsWithAI.length : 0,

    averageCarryDelta: avgCarryDelta,
  };
}
