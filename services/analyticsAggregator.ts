/**
 * Analytics Aggregator (Web)
 *
 * Builds long-term analytics from InferredShotRecords stored in Firestore.
 * Runs after each round completes and can be queried on demand.
 */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  InferredShotRecord,
  HoleAnalytics,
  ClubAnalytics,
  RoundAnalyticsSummary,
} from '../types/roundAnalytics.types';

function getDb() { return getFirestore(); }

function getUserId(): string {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No authenticated user');
  return user.uid;
}

// ─────────────────────────────────────────────
// CLUB ANALYTICS
// ─────────────────────────────────────────────

type ShotOutcome = InferredShotRecord['outcome'];

/**
 * Build per-club analytics from a set of inferred shot records.
 */
export function buildClubAnalytics(shots: InferredShotRecord[]): ClubAnalytics[] {
  const byClub = new Map<string, InferredShotRecord[]>();

  for (const shot of shots) {
    if (!shot.clubUsed) continue;
    if (!byClub.has(shot.clubUsed)) byClub.set(shot.clubUsed, []);
    byClub.get(shot.clubUsed)!.push(shot);
  }

  const clubAnalytics: ClubAnalytics[] = [];

  for (const [clubName, clubShots] of byClub.entries()) {
    const carries = clubShots
      .map(s => s.actualDistanceTraveled)
      .filter((d): d is number => d !== null && d > 0);

    const carryDeltas = clubShots
      .map(s => s.carryDeltaYards)
      .filter((d): d is number => d !== null);

    const avgCarry = carries.length > 0 ? mean(carries) : 0;
    const carryStdDev = carries.length > 1 ? stdDev(carries) : 0;
    const avgDelta = carryDeltas.length > 0 ? mean(carryDeltas) : 0;

    const within10Yards = carryDeltas.filter(d => Math.abs(d) <= 10).length;
    const optimizerAccuracy =
      carryDeltas.length > 0 ? within10Yards / carryDeltas.length : 0;

    const greenShots = clubShots.filter(s => s.landedOnGreen);
    const fairwayShots = clubShots.filter(s => s.landedInFairway === true);
    const firEligibleShots = clubShots.filter(s => s.landedInFairway !== null);

    const timesRecommended = clubShots.filter(
      s => s.primarySuggestion === clubName || s.secondarySuggestion === clubName
    ).length;

    const followedShots = clubShots.filter(
      s =>
        s.recommendationCompliance === 'followed_primary' ||
        s.recommendationCompliance === 'followed_secondary'
    );
    const overrodeShots = clubShots.filter(
      s => s.recommendationCompliance === 'overrode'
    );

    const goodOutcomes: ShotOutcome[] = ['on_green', 'in_fairway', 'chip_on'];
    const followedGood = followedShots.filter(s => goodOutcomes.includes(s.outcome)).length;
    const followedPoor = followedShots.length - followedGood;
    const overrodeGood = overrodeShots.filter(s => goodOutcomes.includes(s.outcome)).length;
    const overrodePoor = overrodeShots.length - overrodeGood;

    clubAnalytics.push({
      clubName,
      totalShots: clubShots.length,

      averageCarryYards: avgCarry,
      averageTotalYards: avgCarry,
      carryStdDevYards: carryStdDev,
      minCarryYards: carries.length > 0 ? Math.min(...carries) : 0,
      maxCarryYards: carries.length > 0 ? Math.max(...carries) : 0,

      averageCarryDeltaYards: avgDelta,
      optimizerAccuracy,

      greenHitRate: clubShots.length > 0 ? greenShots.length / clubShots.length : 0,
      fairwayHitRate:
        firEligibleShots.length > 0 ? fairwayShots.length / firEligibleShots.length : 0,

      timesRecommended,
      timesUsed: clubShots.length,
      followThroughRate:
        timesRecommended > 0 ? clubShots.length / timesRecommended : 0,

      outcomeWhenFollowedAI: { good: followedGood, poor: followedPoor },
      outcomeWhenOverrodeAI: { good: overrodeGood, poor: overrodePoor },
    });
  }

  return clubAnalytics.sort((a, b) => b.totalShots - a.totalShots);
}

// ─────────────────────────────────────────────
// ROUND SUMMARY
// ─────────────────────────────────────────────

export function buildRoundSummary(params: {
  roundId: string;
  courseId?: string;
  courseName?: string;
  date: string;
  holeAnalytics: HoleAnalytics[];
  allShots: InferredShotRecord[];
}): RoundAnalyticsSummary {
  const { roundId, courseId, courseName, date, holeAnalytics, allShots } = params;
  const userId = getUserId();

  const totalScore = holeAnalytics.reduce((sum, h) => sum + h.score, 0);
  const totalPar = holeAnalytics.reduce((sum, h) => sum + h.par, 0);

  const firHoles = holeAnalytics.filter(h => h.par >= 4);
  const fairwaysHit = firHoles.filter(h => h.fairwayHit === true).length;

  const greensInRegulation = holeAnalytics.filter(h => h.greenInRegulation).length;
  const totalPutts = holeAnalytics.reduce((sum, h) => sum + h.putts, 0);

  const totalShotsWithOptimizer = allShots.filter(s => s.optimizerRan).length;
  const totalShotsWithAI = allShots.filter(s => s.recommendationCompliance !== 'no_ai_used').length;
  const totalFollowedAI = allShots.filter(
    s =>
      s.recommendationCompliance === 'followed_primary' ||
      s.recommendationCompliance === 'followed_secondary'
  ).length;

  const holesWithAI = holeAnalytics.filter(h => h.shotsWithAI > 0);
  const followedHoles = holesWithAI.filter(h => h.complianceRate >= 0.5);
  const overrodeHoles = holesWithAI.filter(h => h.complianceRate < 0.5);

  const avgScoreFollowed =
    followedHoles.length > 0
      ? mean(followedHoles.map(h => h.score - h.par))
      : 0;
  const avgScoreOverrode =
    overrodeHoles.length > 0
      ? mean(overrodeHoles.map(h => h.score - h.par))
      : 0;

  const carryDeltas = allShots
    .map(s => s.carryDeltaYards)
    .filter((d): d is number => d !== null);
  const avgCarryDelta = carryDeltas.length > 0 ? mean(carryDeltas) : 0;

  return {
    roundId,
    userId,
    courseId,
    courseName,
    date,

    totalScore,
    totalPar,
    scoreRelativeToPar: totalScore - totalPar,
    holesPlayed: holeAnalytics.length,

    fairwaysHit,
    fairwaysTotal: firHoles.length,
    fairwayPercentage: firHoles.length > 0 ? fairwaysHit / firHoles.length : 0,

    greensInRegulation,
    girTotal: holeAnalytics.length,
    girPercentage: holeAnalytics.length > 0 ? greensInRegulation / holeAnalytics.length : 0,

    totalPutts,
    averagePuttsPerHole: holeAnalytics.length > 0 ? totalPutts / holeAnalytics.length : 0,

    totalShotsWithOptimizer,
    totalShotsWithAI,
    overallComplianceRate:
      totalShotsWithAI > 0 ? totalFollowedAI / totalShotsWithAI : 0,

    scoreWhenFollowedAI: avgScoreFollowed,
    scoreWhenOverrodeAI: avgScoreOverrode,

    averageCarryDeltaAllClubs: avgCarryDelta,

    holeAnalytics,
  };
}

// ─────────────────────────────────────────────
// FIRESTORE READ/WRITE
// ─────────────────────────────────────────────

export async function loadShotsForAnalytics(
  periodDays: number = 90
): Promise<InferredShotRecord[]> {
  const userId = getUserId();
  const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;

  const snap = await getDocs(
    query(
      collection(getDb(), 'inferredShots'),
      where('userId', '==', userId),
      where('timestamp', '>=', cutoff),
      where('optimizerRan', '==', true),
      orderBy('timestamp', 'desc')
    )
  );

  return snap.docs.map(d => d.data() as InferredShotRecord);
}

export async function persistClubAnalytics(
  clubAnalytics: ClubAnalytics[]
): Promise<void> {
  const userId = getUserId();
  const db = getDb();
  const batch = writeBatch(db);

  for (const ca of clubAnalytics) {
    const ref = doc(
      collection(db, 'clubAnalytics'),
      `${userId}_${ca.clubName.replace(/\s+/g, '_')}`
    );
    batch.set(ref, {
      ...ca,
      userId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  await batch.commit();
}

export async function loadClubAnalytics(): Promise<ClubAnalytics[]> {
  const userId = getUserId();

  const snap = await getDocs(
    query(
      collection(getDb(), 'clubAnalytics'),
      where('userId', '==', userId)
    )
  );

  return snap.docs.map(d => d.data() as ClubAnalytics);
}

export async function loadRecentRoundSummaries(limitCount = 20): Promise<RoundAnalyticsSummary[]> {
  const userId = getUserId();

  const snap = await getDocs(
    query(
      collection(getDb(), 'roundSummaries'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    )
  );

  return snap.docs.map(d => d.data() as RoundAnalyticsSummary);
}

// ─────────────────────────────────────────────
// MATH UTILITIES
// ─────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}
