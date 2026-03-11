/**
 * Shot Inference Engine
 *
 * Reconstructs shot-by-shot records from:
 *  - Optimizer runs (GPS + club recommendations per shot)
 *  - AI club selections (what the user actually said they'd hit)
 *  - Hole score data (score, FIR, GIR, putts)
 *
 * Called when a hole score is saved. No user input required.
 */

import { Timestamp } from 'firebase/firestore';
import type {
  OptimizerRunEvent,
  AIClubSelectionEvent,
  InferredShot,
  HoleAnalytics,
  RecordHoleScoreInput,
  RecommendationCompliance,
  ShotType,
  ShotLandingArea,
  GPSCoord,
} from '@/types/shotAnalytics';

// Haversine distance between two GPS coords → yards
function haversineYards(a: GPSCoord, b: GPSCoord): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sinDLat * sinDLat + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon),
      Math.sqrt(1 - sinDLat * sinDLat - Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon)
    );
  return R * c * 1.09361;
}

function normaliseClub(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function clubsMatch(a: string, b: string): boolean {
  return normaliseClub(a) === normaliseClub(b);
}

function deriveCompliance(
  run: OptimizerRunEvent,
  aiSelections: AIClubSelectionEvent[]
): { compliance: RecommendationCompliance; clubUsed: string } {
  // Find the AI selection that most closely follows this optimizer run in time
  const afterRun = aiSelections.filter(
    (s) => s.holeNumber === run.holeNumber && s.timestamp.toMillis() >= run.timestamp.toMillis()
  );
  if (afterRun.length === 0) {
    return { compliance: 'unknown', clubUsed: run.primaryClub };
  }
  const selection = afterRun.reduce((latest, cur) =>
    cur.timestamp.toMillis() < latest.timestamp.toMillis() ? cur : latest
  );
  const club = selection.selectedClub;
  if (clubsMatch(club, run.primaryClub)) {
    return { compliance: 'followed_primary', clubUsed: club };
  }
  if (run.secondaryClub && clubsMatch(club, run.secondaryClub)) {
    return { compliance: 'followed_secondary', clubUsed: club };
  }
  return { compliance: 'overrode', clubUsed: club };
}

function inferShotType(shotNumber: number, par: number, score: number, isTracked: boolean): ShotType {
  if (!isTracked) return 'chip';
  if (shotNumber === 1) return 'tee';
  return 'approach';
}

function inferLandingArea(
  shotNumber: number,
  shotsBeforePutting: number,
  untrackedShots: number,
  fir: boolean | null,
  gir: boolean,
  par: number
): ShotLandingArea {
  const isLastShotBeforePutting = shotNumber === shotsBeforePutting;

  if (isLastShotBeforePutting) {
    return gir ? 'green' : 'rough'; // Missed green goes to rough (chipped on after)
  }
  if (shotNumber === 1 && par >= 4) {
    return fir === true ? 'fairway' : fir === false ? 'rough' : 'unknown';
  }
  return 'unknown';
}

/**
 * Infer all shots for a single hole.
 *
 * Returns both the inferred shots and the full HoleAnalytics record.
 */
export function inferHoleShots(params: {
  roundId: string;
  userId: string;
  holeScore: RecordHoleScoreInput;
  optimizerRuns: OptimizerRunEvent[]; // runs for THIS hole, sorted by timestamp asc
  aiSelections: AIClubSelectionEvent[]; // selections for THIS hole
}): { shots: InferredShot[]; holeAnalytics: Omit<HoleAnalytics, 'timestamp'> } {
  const { roundId, userId, holeScore, optimizerRuns, aiSelections } = params;
  const { holeNumber, par, score, fairwayInRegulation: fir, greenInRegulation: gir, putts, penaltyStrokes } = holeScore;

  const shotsBeforePutting = score - putts;
  const trackedShots = optimizerRuns.length;
  const untrackedShots = Math.max(0, shotsBeforePutting - trackedShots);

  const shots: InferredShot[] = [];
  const now = Timestamp.now();

  // ── Tracked shots (one per optimizer run) ──────────────────────────────────
  for (let i = 0; i < optimizerRuns.length; i++) {
    const run = optimizerRuns[i];
    const shotNumber = i + 1;
    const nextRun = optimizerRuns[i + 1];

    const { compliance, clubUsed } = deriveCompliance(run, aiSelections);

    // Actual distance: GPS delta to next optimizer run position (if available)
    let actualDistanceTraveled: number | undefined;
    if (nextRun) {
      actualDistanceTraveled = haversineYards(run.gpsPosition, nextRun.gpsPosition);
    }

    // Carry delta: actual carry vs predicted (only when we have the next GPS)
    const expectedCarry = run.primaryExpectedCarry;
    const carryDeltaYards =
      actualDistanceTraveled !== undefined ? actualDistanceTraveled - expectedCarry : undefined;

    const landingArea = inferLandingArea(shotNumber, shotsBeforePutting, untrackedShots, fir, gir, par);
    const landedOnGreen = landingArea === 'green';
    const landedInFairway = landingArea === 'fairway';

    shots.push({
      shotId: `${roundId}_h${holeNumber}_s${shotNumber}`,
      roundId,
      userId,
      holeNumber,
      shotNumber,
      timestamp: run.timestamp,
      clubUsed,
      shotType: inferShotType(shotNumber, par, score, true),
      positionFrom: run.gpsPosition,
      positionTo: nextRun?.gpsPosition,
      actualDistanceTraveled,
      recommendedPrimaryClub: run.primaryClub,
      recommendedSecondaryClub: run.secondaryClub,
      recommendationCompliance: compliance,
      expectedCarryYards: expectedCarry,
      carryDeltaYards,
      landingArea,
      landedOnGreen,
      landedInFairway,
      distanceToPinAfterShot: nextRun?.distanceToPin,
    });
  }

  // ── Untracked shots (chips / recovery — no optimizer run) ──────────────────
  for (let i = 0; i < untrackedShots; i++) {
    const shotNumber = trackedShots + i + 1;
    const isLastBeforePutt = shotNumber === shotsBeforePutting;
    const landingArea: ShotLandingArea = isLastBeforePutt ? 'green' : 'rough';

    shots.push({
      shotId: `${roundId}_h${holeNumber}_s${shotNumber}`,
      roundId,
      userId,
      holeNumber,
      shotNumber,
      timestamp: now,
      clubUsed: 'Unknown',
      shotType: 'chip',
      recommendationCompliance: 'no_recommendation',
      landingArea,
      landedOnGreen: landingArea === 'green',
      landedInFairway: false,
    });
  }

  // ── Compliance rate (tracked shots only) ───────────────────────────────────
  const trackedComplied = shots.filter(
    (s) => s.recommendationCompliance === 'followed_primary' || s.recommendationCompliance === 'followed_secondary'
  ).length;
  const complianceRate = trackedShots > 0 ? trackedComplied / trackedShots : 0;

  const holeAnalytics: Omit<HoleAnalytics, 'timestamp'> = {
    docId: `${roundId}_hole${holeNumber}`,
    roundId,
    userId,
    holeNumber,
    par,
    score,
    scoreRelativeToPar: score - par,
    fairwayInRegulation: fir,
    greenInRegulation: gir,
    putts,
    penaltyStrokes,
    shotsBeforePutting,
    untrackedShots,
    complianceRate,
    shots,
  };

  return { shots, holeAnalytics };
}

/**
 * Compute round-level aggregate stats from all hole analytics.
 */
export function computeRoundSummary(params: {
  roundId: string;
  userId: string;
  courseId?: string;
  courseName?: string;
  date: string;
  holes: HoleAnalytics[];
}): Omit<import('@/types/shotAnalytics').RoundSummary, 'timestamp'> {
  const { roundId, userId, courseId, courseName, date, holes } = params;

  let totalScore = 0;
  let totalPar = 0;
  let fairwaysHit = 0;
  let fairwayOpportunities = 0;
  let greensInRegulation = 0;
  let totalPutts = 0;
  let totalTrackedShots = 0;
  let followedPrimaryCount = 0;
  let followedSecondaryCount = 0;
  let overrodeCount = 0;

  // For score-impact calc
  const holesWithFollow: number[] = [];
  const holesWithOverride: number[] = [];

  for (const hole of holes) {
    totalScore += hole.score;
    totalPar += hole.par;
    if (hole.greenInRegulation) greensInRegulation++;
    if (hole.fairwayInRegulation === true) fairwaysHit++;
    if (hole.fairwayInRegulation !== null) fairwayOpportunities++;
    totalPutts += hole.putts;

    for (const shot of hole.shots) {
      if (shot.recommendationCompliance === 'no_recommendation' || shot.recommendationCompliance === 'unknown') continue;
      totalTrackedShots++;
      if (shot.recommendationCompliance === 'followed_primary') followedPrimaryCount++;
      else if (shot.recommendationCompliance === 'followed_secondary') followedSecondaryCount++;
      else if (shot.recommendationCompliance === 'overrode') overrodeCount++;
    }

    const holeFollowed = hole.shots.some(
      (s) => s.recommendationCompliance === 'followed_primary' || s.recommendationCompliance === 'followed_secondary'
    );
    const holeOverrode = hole.shots.some((s) => s.recommendationCompliance === 'overrode');
    if (holeFollowed) holesWithFollow.push(hole.scoreRelativeToPar);
    if (holeOverrode) holesWithOverride.push(hole.scoreRelativeToPar);
  }

  const overallComplianceRate =
    totalTrackedShots > 0 ? (followedPrimaryCount + followedSecondaryCount) / totalTrackedShots : 0;

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return {
    roundId,
    userId,
    courseId,
    courseName,
    date,
    totalScore,
    totalPar,
    scoreRelativeToPar: totalScore - totalPar,
    holesPlayed: holes.length,
    fairwaysHit,
    fairwayOpportunities,
    greensInRegulation,
    totalPutts,
    totalTrackedShots,
    followedPrimaryCount,
    followedSecondaryCount,
    overrodeCount,
    overallComplianceRate,
    scoreWhenFollowedAI: avg(holesWithFollow),
    scoreWhenOverrodeAI: avg(holesWithOverride),
  };
}

/**
 * Update club analytics with shots from a completed round.
 * Returns a map of clubName → updated ClubAnalytics (caller must persist).
 */
export function updateClubAnalytics(params: {
  userId: string;
  shots: InferredShot[];
  existingClubStats: Record<string, import('@/types/shotAnalytics').ClubAnalytics>;
}): Record<string, import('@/types/shotAnalytics').ClubAnalytics> {
  const { userId, shots, existingClubStats } = params;
  const now = Timestamp.now();

  // Group new shots by club
  const shotsByClub: Record<string, InferredShot[]> = {};
  for (const shot of shots) {
    if (!shot.clubUsed || shot.clubUsed === 'Unknown') continue;
    (shotsByClub[shot.clubUsed] ??= []).push(shot);
  }

  const updated = { ...existingClubStats };

  for (const [clubName, newShots] of Object.entries(shotsByClub)) {
    const existing = updated[clubName];
    const prevTotal = existing?.totalShots ?? 0;

    // Carry distance samples
    const carrySamples = newShots
      .filter((s) => s.actualDistanceTraveled !== undefined)
      .map((s) => s.actualDistanceTraveled!);

    const carryDeltas = newShots
      .filter((s) => s.carryDeltaYards !== undefined)
      .map((s) => s.carryDeltaYards!);

    // Running averages (combine with existing)
    const allCarries = existing ? [...Array(prevTotal).fill(existing.averageCarryYards), ...carrySamples] : carrySamples;
    const avgCarry = allCarries.length > 0 ? allCarries.reduce((a, b) => a + b, 0) / allCarries.length : 0;

    // Carry std dev (simplified — uses new shots + existing avg)
    const carryVariance =
      carrySamples.length > 1
        ? carrySamples.reduce((sum, c) => sum + (c - avgCarry) ** 2, 0) / (carrySamples.length - 1)
        : (existing?.carryStdDevYards ?? 0) ** 2;

    const allDeltas = existing
      ? [...Array(prevTotal).fill(existing.averageCarryDeltaYards), ...carryDeltas]
      : carryDeltas;
    const avgDelta = allDeltas.length > 0 ? allDeltas.reduce((a, b) => a + b, 0) / allDeltas.length : 0;

    const greenShots = newShots.filter((s) => s.shotType === 'approach');
    const greensHit = greenShots.filter((s) => s.landedOnGreen).length;
    const teeShots = newShots.filter((s) => s.shotType === 'tee');
    const fairwaysHit = teeShots.filter((s) => s.landedInFairway).length;

    const newFollowed = newShots.filter(
      (s) => s.recommendationCompliance === 'followed_primary' || s.recommendationCompliance === 'followed_secondary'
    ).length;
    const newOverrode = newShots.filter((s) => s.recommendationCompliance === 'overrode').length;

    updated[clubName] = {
      docId: `${userId}_${clubName}`,
      userId,
      clubName,
      totalShots: prevTotal + newShots.length,
      roundsPlayed: (existing?.roundsPlayed ?? 0) + 1,
      averageCarryYards: avgCarry,
      carryStdDevYards: Math.sqrt(carryVariance),
      averageCarryDeltaYards: avgDelta,
      optimizerAccuracy: avgDelta !== 0 ? Math.max(0, 1 - Math.abs(avgDelta) / Math.max(avgCarry, 1)) : 1,
      greenHitRate:
        greenShots.length > 0
          ? ((existing?.greenHitRate ?? 0) * (existing?.roundsPlayed ?? 0) + greensHit / greenShots.length) /
            ((existing?.roundsPlayed ?? 0) + 1)
          : existing?.greenHitRate ?? 0,
      fairwayHitRate:
        teeShots.length > 0
          ? ((existing?.fairwayHitRate ?? 0) * (existing?.roundsPlayed ?? 0) + fairwaysHit / teeShots.length) /
            ((existing?.roundsPlayed ?? 0) + 1)
          : existing?.fairwayHitRate ?? 0,
      outcomeWhenFollowedAI: existing?.outcomeWhenFollowedAI ?? 0,
      outcomeWhenOverrodeAI: existing?.outcomeWhenOverrodeAI ?? 0,
      followedCount: (existing?.followedCount ?? 0) + newFollowed,
      overrodeCount: (existing?.overrodeCount ?? 0) + newOverrode,
      lastUpdated: now,
    };
  }

  return updated;
}
