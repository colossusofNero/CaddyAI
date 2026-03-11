/**
 * Shot Analytics Service
 *
 * Reads and writes the five shot-analytics Firestore collections:
 *   roundAnalyticsEvents/   — raw optimizer runs + AI club selections
 *   inferredShots/          — inferred shot records (written on hole save)
 *   holeAnalytics/          — per-hole summaries
 *   clubAnalytics/          — aggregated per-club stats
 *   roundSummaries/         — round-level summaries
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { inferHoleShots, computeRoundSummary, updateClubAnalytics } from '@/lib/api/inferenceEngine';
import type {
  OptimizerRunEvent,
  AIClubSelectionEvent,
  RoundAnalyticsEvent,
  InferredShot,
  HoleAnalytics,
  ClubAnalytics,
  RoundSummary,
  RecordOptimizerRunInput,
  RecordHoleScoreInput,
  EndRoundInput,
} from '@/types/shotAnalytics';

// ─── Collection names ─────────────────────────────────────────────────────────

const COL = {
  events: 'roundAnalyticsEvents',
  shots: 'inferredShots',
  holes: 'holeAnalytics',
  clubs: 'clubAnalytics',
  rounds: 'roundSummaries',
} as const;

// ─── ID helpers ───────────────────────────────────────────────────────────────

function eventId(userId: string, type: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${type}_${userId.slice(0, 6)}_${ts}_${rand}`;
}

// ─── Write: raw events ────────────────────────────────────────────────────────

export async function recordOptimizerRun(
  userId: string,
  roundId: string,
  input: RecordOptimizerRunInput
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');

  const id = eventId(userId, 'opt');
  const event: OptimizerRunEvent = {
    eventType: 'optimizer_run',
    eventId: id,
    roundId,
    userId,
    holeNumber: input.holeNumber,
    timestamp: Timestamp.now(),
    gpsPosition: input.gpsPosition,
    distanceToPin: input.distanceToPin,
    lie: input.lie,
    stance: input.stance,
    elevation: input.elevation,
    windSpeed: input.windSpeed,
    windDirection: input.windDirection,
    confidence: input.confidence,
    pinLocation: input.pinLocation,
    pinSide: input.pinSide,
    primaryClub: input.primaryClub,
    primaryExpectedCarry: input.primaryExpectedCarry,
    primaryTotalDistance: input.primaryTotalDistance,
    primaryConfidenceScore: input.primaryConfidenceScore,
    secondaryClub: input.secondaryClub,
    secondaryExpectedCarry: input.secondaryExpectedCarry,
    secondaryTotalDistance: input.secondaryTotalDistance,
    secondaryConfidenceScore: input.secondaryConfidenceScore,
  };

  await setDoc(doc(db, COL.events, id), event);
  return id;
}

export async function recordAIClubSelection(
  userId: string,
  roundId: string,
  holeNumber: number,
  selectedClub: string
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');

  const id = eventId(userId, 'sel');
  const event: AIClubSelectionEvent = {
    eventType: 'ai_club_selection',
    eventId: id,
    roundId,
    userId,
    holeNumber,
    timestamp: Timestamp.now(),
    selectedClub,
  };

  await setDoc(doc(db, COL.events, id), event);
  return id;
}

// ─── Read: raw events for a round ─────────────────────────────────────────────

export async function getRoundEvents(roundId: string): Promise<RoundAnalyticsEvent[]> {
  if (!db) throw new Error('Firestore not initialized');

  const q = query(
    collection(db, COL.events),
    where('roundId', '==', roundId),
    orderBy('holeNumber', 'asc'),
    orderBy('timestamp', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as RoundAnalyticsEvent);
}

// ─── Write: infer + persist hole analytics ────────────────────────────────────

/**
 * Called when the user saves a hole score.
 * Reads all round events, runs the inference engine, and persists results.
 */
export async function saveHoleAnalytics(
  userId: string,
  roundId: string,
  holeScore: RecordHoleScoreInput,
  /** Pass in-memory events accumulated so far to avoid a Firestore read */
  inMemoryEvents?: RoundAnalyticsEvent[]
): Promise<HoleAnalytics> {
  if (!db) throw new Error('Firestore not initialized');

  const events = inMemoryEvents ?? (await getRoundEvents(roundId));

  const holeEvents = events.filter((e) => e.holeNumber === holeScore.holeNumber);
  const optimizerRuns = holeEvents.filter(
    (e): e is OptimizerRunEvent => e.eventType === 'optimizer_run'
  );
  const aiSelections = holeEvents.filter(
    (e): e is AIClubSelectionEvent => e.eventType === 'ai_club_selection'
  );

  const { holeAnalytics } = inferHoleShots({
    roundId,
    userId,
    holeScore,
    optimizerRuns,
    aiSelections,
  });

  const full: HoleAnalytics = { ...holeAnalytics, timestamp: Timestamp.now() };

  const batch = writeBatch(db);

  // Persist hole analytics doc
  batch.set(doc(db, COL.holes, full.docId), full);

  // Persist each inferred shot
  for (const shot of full.shots) {
    batch.set(doc(db, COL.shots, shot.shotId), shot);
  }

  await batch.commit();
  return full;
}

// ─── Write: round summary + club analytics on round end ───────────────────────

export async function finaliseRound(
  userId: string,
  roundId: string,
  input: EndRoundInput
): Promise<RoundSummary> {
  if (!db) throw new Error('Firestore not initialized');

  // Load all hole analytics for this round
  const holesSnap = await getDocs(
    query(collection(db, COL.holes), where('roundId', '==', roundId), where('userId', '==', userId))
  );
  const holes = holesSnap.docs.map((d) => d.data() as HoleAnalytics);

  // Load existing club analytics for this user
  const clubsSnap = await getDocs(
    query(collection(db, COL.clubs), where('userId', '==', userId))
  );
  const existingClubStats: Record<string, ClubAnalytics> = {};
  for (const d of clubsSnap.docs) {
    const ca = d.data() as ClubAnalytics;
    existingClubStats[ca.clubName] = ca;
  }

  // Compute round summary
  const summaryData = computeRoundSummary({
    roundId,
    userId,
    courseId: input.courseId,
    courseName: input.courseName,
    date: input.date,
    holes,
  });
  const summary: RoundSummary = { ...summaryData, timestamp: Timestamp.now() };

  // Update club analytics
  const allShots = holes.flatMap((h) => h.shots);
  const updatedClubs = updateClubAnalytics({ userId, shots: allShots, existingClubStats });

  // Batch write
  const batch = writeBatch(db);
  batch.set(doc(db, COL.rounds, roundId), summary);
  for (const ca of Object.values(updatedClubs)) {
    batch.set(doc(db, COL.clubs, ca.docId), ca);
  }
  await batch.commit();

  return summary;
}

// ─── Read: analytics for display ─────────────────────────────────────────────

export async function getClubAnalytics(userId: string): Promise<ClubAnalytics[]> {
  if (!db) throw new Error('Firestore not initialized');

  const snap = await getDocs(
    query(collection(db, COL.clubs), where('userId', '==', userId))
  );
  const clubs = snap.docs.map((d) => d.data() as ClubAnalytics);
  return clubs.sort((a, b) => b.totalShots - a.totalShots);
}

export async function getRoundSummaries(userId: string, limitCount = 20): Promise<RoundSummary[]> {
  if (!db) throw new Error('Firestore not initialized');

  const snap = await getDocs(
    query(
      collection(db, COL.rounds),
      where('userId', '==', userId),
      limit(limitCount)
    )
  );
  const rounds = snap.docs.map((d) => d.data() as RoundSummary);
  return rounds.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getRoundSummary(roundId: string): Promise<RoundSummary | null> {
  if (!db) throw new Error('Firestore not initialized');

  const snap = await getDoc(doc(db, COL.rounds, roundId));
  return snap.exists() ? (snap.data() as RoundSummary) : null;
}

export async function getHoleAnalytics(roundId: string): Promise<HoleAnalytics[]> {
  if (!db) throw new Error('Firestore not initialized');

  const snap = await getDocs(
    query(
      collection(db, COL.holes),
      where('roundId', '==', roundId),
      orderBy('holeNumber', 'asc')
    )
  );
  return snap.docs.map((d) => d.data() as HoleAnalytics);
}

export async function getInferredShots(
  userId: string,
  options: { roundId?: string; limitCount?: number } = {}
): Promise<InferredShot[]> {
  if (!db) throw new Error('Firestore not initialized');

  const constraints = [
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(options.limitCount ?? 200),
  ];
  if (options.roundId) {
    constraints.unshift(where('roundId', '==', options.roundId));
  }

  const snap = await getDocs(query(collection(db, COL.shots), ...constraints));
  return snap.docs.map((d) => d.data() as InferredShot);
}
