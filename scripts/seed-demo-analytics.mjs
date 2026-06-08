/**
 * Seed AI Shot Analytics for the demo King-Starfire round so the
 * /analytics/shot-data page lights up: a roundSummaries doc (AI compliance +
 * score impact) and clubAnalytics docs (carry accuracy per club).
 *
 * Consistent with scores/demo-king-starfire: gross 95, par 70, GIR 5/18,
 * FIR 6/12, 39 putts. Idempotent (fixed doc ids). Marked isDemo: true.
 *
 * AI-compliance narrative (the product story): 75% follow rate, and the player
 * scored +1.0/hole when following the AI vs +2.1/hole when overriding it.
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const UID = 'ZOR4qaBeDeUQL9X7bfjUTyaTyIo2';
const ROUND_ID = 'demo-king-starfire';
const COURSE = { id: 'oYEPmjf4lKJK', name: 'The King - Starfire Golf Club' };
const DATE = '2026-06-05';
const now = Timestamp.now();

// ─── Round summary (AI compliance + score impact) ───────────────────────────
const followedPrimaryCount = 20;
const followedSecondaryCount = 4;
const overrodeCount = 8;
const totalTrackedShots = followedPrimaryCount + followedSecondaryCount + overrodeCount; // 32

const roundSummary = {
  roundId: ROUND_ID,
  userId: UID,
  courseId: COURSE.id,
  courseName: COURSE.name,
  date: DATE,

  totalScore: 95,
  totalPar: 70,
  scoreRelativeToPar: 25,

  holesPlayed: 18,
  fairwaysHit: 6,
  fairwayOpportunities: 12,
  greensInRegulation: 5,
  totalPutts: 39,

  totalTrackedShots,
  followedPrimaryCount,
  followedSecondaryCount,
  overrodeCount,
  overallComplianceRate: (followedPrimaryCount + followedSecondaryCount) / totalTrackedShots, // 0.75

  scoreWhenFollowedAI: 1.0, // avg vs par per hole when following AI
  scoreWhenOverrodeAI: 2.1, // avg vs par per hole when overriding

  isDemo: true,
  timestamp: now,
};

// ─── Per-club carry analytics ───────────────────────────────────────────────
// [clubName, avgCarry, stdDev, deltaVsPredicted, optimizerAccuracy,
//  greenHitRate, fairwayHitRate, totalShots]
const CLUBS = [
  ['Driver', 232, 19, -6, 0.87, 0.0, 0.5, 12],
  ['5-wood', 205, 16, -5, 0.88, 0.0, 0.5, 3],
  ['4-iron', 188, 15, -7, 0.85, 0.2, 0.0, 3],
  ['5-iron', 175, 14, -6, 0.86, 0.3, 0.0, 5],
  ['6-iron', 163, 12, -4, 0.89, 0.4, 0.0, 5],
  ['7-iron', 150, 11, -3, 0.91, 0.5, 0.0, 6],
  ['8-iron', 138, 10, -2, 0.92, 0.5, 0.0, 4],
  ['9-iron', 125, 9, -2, 0.93, 0.55, 0.0, 3],
  ['PW', 108, 9, -3, 0.9, 0.45, 0.0, 6],
  ['SW', 78, 8, -2, 0.9, 0.4, 0.0, 4],
  ['LW', 52, 7, -1, 0.91, 0.5, 0.0, 4],
];

const clubDocs = CLUBS.map(
  ([clubName, avgCarry, stdDev, delta, optAcc, greenRate, fairwayRate, shots]) => {
    const followed = Math.round(shots * 0.75);
    return {
      docId: `${UID}_${clubName}`,
      userId: UID,
      clubName,
      totalShots: shots,
      roundsPlayed: 1,
      averageCarryYards: avgCarry,
      carryStdDevYards: stdDev,
      averageCarryDeltaYards: delta,
      optimizerAccuracy: optAcc,
      greenHitRate: greenRate,
      fairwayHitRate: fairwayRate,
      outcomeWhenFollowedAI: 1.0,
      outcomeWhenOverrodeAI: 2.1,
      followedCount: followed,
      overrodeCount: shots - followed,
      isDemo: true,
      lastUpdated: now,
    };
  }
);

// ─── Write ──────────────────────────────────────────────────────────────────
const batch = db.batch();
batch.set(db.collection('roundSummaries').doc(ROUND_ID), roundSummary);
for (const c of clubDocs) {
  batch.set(db.collection('clubAnalytics').doc(c.docId), c);
}
await batch.commit();

console.log(`Wrote roundSummaries/${ROUND_ID} + ${clubDocs.length} clubAnalytics docs for ${UID}`);
console.log(
  `  Compliance: ${(roundSummary.overallComplianceRate * 100).toFixed(0)}% (${followedPrimaryCount + followedSecondaryCount}/${totalTrackedShots}) · ` +
    `follow +${roundSummary.scoreWhenFollowedAI}/hole vs override +${roundSummary.scoreWhenOverrodeAI}/hole`
);
console.log(`  Clubs: ${clubDocs.map((c) => c.clubName).join(', ')}`);

// verify reads
const rs = await db.collection('roundSummaries').doc(ROUND_ID).get();
const ca = await db.collection('clubAnalytics').where('userId', '==', UID).get();
console.log(`\nVerify: roundSummary exists=${rs.exists}, clubAnalytics for user=${ca.size}`);
