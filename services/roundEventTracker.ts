/**
 * Round Event Tracker (Web)
 *
 * Passively captures events during a round:
 *   - Each optimizer run (with GPS position + suggestions)
 *   - Each AI club selection (what club user said they'd use)
 *
 * Events are buffered in localStorage and Firestore during play,
 * then fed into the inference engine when hole score is saved.
 */

import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  setDoc,
  getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  OptimizerRunEvent,
  AIClubSelectionEvent,
  HoleScoreEvent,
} from '../types/roundAnalytics.types';
import { inferHoleShots, InferenceResult } from './shotInferenceEngine';

function getDb() { return getFirestore(); }

const BUFFER_KEY = 'ROUND_ANALYTICS_BUFFER';

// ─────────────────────────────────────────────
// IN-MEMORY BUFFER
// ─────────────────────────────────────────────

interface EventBuffer {
  roundId: string;
  currentHole: number;
  optimizerEvents: OptimizerRunEvent[];
  aiSelectionEvents: AIClubSelectionEvent[];
  holeScoreEvents: HoleScoreEvent[];
  optimizerCountPerHole: Record<number, number>;
  lastOptimizerEventIdPerHole: Record<number, string>;
}

let buffer: EventBuffer | null = null;

function getUserId(): string {
  const user = getAuth().currentUser;
  if (!user) throw new Error('No authenticated user');
  return user.uid;
}

function saveBufferToStorage(): void {
  if (!buffer) return;
  try {
    localStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
  } catch (e) {
    console.warn('[RoundEventTracker] Failed to persist buffer:', e);
  }
}

function loadBufferFromStorage(): void {
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    if (raw) {
      buffer = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[RoundEventTracker] Failed to load buffer:', e);
  }
}

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

export async function initRoundTracker(roundId: string): Promise<void> {
  buffer = {
    roundId,
    currentHole: 1,
    optimizerEvents: [],
    aiSelectionEvents: [],
    holeScoreEvents: [],
    optimizerCountPerHole: {},
    lastOptimizerEventIdPerHole: {},
  };
  saveBufferToStorage();
  console.log('[RoundEventTracker] Round tracker initialized:', roundId);
}

export async function restoreRoundTracker(): Promise<boolean> {
  loadBufferFromStorage();
  return buffer !== null;
}

export function setCurrentHole(holeNumber: number): void {
  if (!buffer) return;
  buffer.currentHole = holeNumber;
}

export async function trackOptimizerRun(params: {
  gpsPosition: { latitude: number; longitude: number; accuracy?: number };
  holeNumber: number;
  distanceToPin: number;
  lie: string;
  stance: string;
  elevation: number;
  windSpeed: number;
  windDirection: string;
  confidence: number;
  pinLocation?: string;
  pinSide?: string;
  primaryClub: string;
  primaryExpectedCarry: number;
  primaryTotalDistance: number;
  primaryConfidenceScore: number;
  secondaryClub: string;
  secondaryExpectedCarry: number;
  secondaryTotalDistance: number;
  secondaryConfidenceScore: number;
}): Promise<string> {
  if (!buffer) {
    console.warn('[RoundEventTracker] No active round buffer. Call initRoundTracker first.');
    return '';
  }

  const {
    gpsPosition, holeNumber, distanceToPin, lie, stance,
    elevation, windSpeed, windDirection, confidence, pinLocation, pinSide,
    primaryClub, primaryExpectedCarry, primaryTotalDistance, primaryConfidenceScore,
    secondaryClub, secondaryExpectedCarry, secondaryTotalDistance, secondaryConfidenceScore,
  } = params;

  const userId = getUserId();
  const eventId = crypto.randomUUID();

  const prevCount = buffer.optimizerCountPerHole[holeNumber] ?? 0;
  const isFirstShot = prevCount === 0;

  const event: OptimizerRunEvent = {
    eventId,
    roundId: buffer.roundId,
    userId,
    holeNumber,
    timestamp: Date.now(),

    gpsPosition,

    shotInputs: {
      distanceToPin,
      lie,
      stance,
      elevation,
      windSpeed,
      windDirection,
      confidence,
      pinLocation,
      pinSide,
    },

    primaryRecommendation: {
      club: primaryClub,
      expectedCarry: primaryExpectedCarry,
      totalDistance: primaryTotalDistance,
      confidenceScore: primaryConfidenceScore,
    },
    secondaryRecommendation: {
      club: secondaryClub,
      expectedCarry: secondaryExpectedCarry,
      totalDistance: secondaryTotalDistance,
      confidenceScore: secondaryConfidenceScore,
    },

    isFirstShotOnHole: isFirstShot,
    sequenceIndex: prevCount,
  };

  buffer.optimizerEvents.push(event);
  buffer.optimizerCountPerHole[holeNumber] = prevCount + 1;
  buffer.lastOptimizerEventIdPerHole[holeNumber] = eventId;

  saveBufferToStorage();

  // Write to Firestore (non-blocking)
  setDoc(doc(collection(getDb(), 'roundAnalyticsEvents'), eventId), {
    ...event,
    eventType: 'optimizer_run',
    createdAt: serverTimestamp(),
  }).catch(e => console.warn('[RoundEventTracker] Firestore write failed:', e));

  console.log(`[RoundEventTracker] Optimizer run recorded: hole ${holeNumber}, shot ${prevCount + 1}, ${primaryClub}`);
  return eventId;
}

export async function trackAIClubSelection(
  selectedClub: string,
  holeNumber: number
): Promise<void> {
  if (!buffer) {
    console.warn('[RoundEventTracker] No active round buffer.');
    return;
  }

  const userId = getUserId();
  const lastOptimizerEventId = buffer.lastOptimizerEventIdPerHole[holeNumber];

  if (!lastOptimizerEventId) {
    console.warn('[RoundEventTracker] No optimizer event to link AI selection to.');
    return;
  }

  const optimizerEvent = buffer.optimizerEvents.find(e => e.eventId === lastOptimizerEventId);
  if (!optimizerEvent) return;

  const normalizedSelected = normalizeClubName(selectedClub);
  const normalizedPrimary = normalizeClubName(optimizerEvent.primaryRecommendation.club);
  const normalizedSecondary = normalizeClubName(optimizerEvent.secondaryRecommendation.club);

  const followedPrimary = normalizedSelected === normalizedPrimary;
  const followedSecondary = normalizedSelected === normalizedSecondary;
  const overrode = !followedPrimary && !followedSecondary;

  const eventId = crypto.randomUUID();

  const event: AIClubSelectionEvent = {
    eventId,
    roundId: buffer.roundId,
    userId,
    holeNumber,
    timestamp: Date.now(),
    optimizerEventId: lastOptimizerEventId,
    selectedClub,
    followedPrimary,
    followedSecondary,
    overrode,
  };

  buffer.aiSelectionEvents.push(event);
  saveBufferToStorage();

  setDoc(doc(collection(getDb(), 'roundAnalyticsEvents'), eventId), {
    ...event,
    eventType: 'ai_club_selection',
    createdAt: serverTimestamp(),
  }).catch(e => console.warn('[RoundEventTracker] Firestore write failed:', e));

  const complianceLabel = followedPrimary
    ? 'followed primary'
    : followedSecondary
    ? 'followed secondary'
    : `overrode (used ${selectedClub})`;

  console.log(`[RoundEventTracker] AI selection: ${selectedClub} → ${complianceLabel}`);
}

export async function processHoleScore(params: {
  holeNumber: number;
  par: number;
  score: number;
  fairwayInRegulation: boolean | null;
  greenInRegulation: boolean;
  putts: number;
  penaltyStrokes?: number;
}): Promise<InferenceResult | null> {
  if (!buffer) {
    console.warn('[RoundEventTracker] No active round buffer.');
    return null;
  }

  const {
    holeNumber, par, score, fairwayInRegulation,
    greenInRegulation, putts, penaltyStrokes = 0,
  } = params;

  const userId = getUserId();
  const scoreEventId = crypto.randomUUID();

  const holeScoreEvent: HoleScoreEvent = {
    eventId: scoreEventId,
    roundId: buffer.roundId,
    userId,
    holeNumber,
    timestamp: Date.now(),
    par,
    score,
    fairwayInRegulation,
    greenInRegulation,
    putts,
    penaltyStrokes,
  };

  buffer.holeScoreEvents.push(holeScoreEvent);
  saveBufferToStorage();

  const holeOptimizerEvents = buffer.optimizerEvents
    .filter(e => e.holeNumber === holeNumber)
    .sort((a, b) => a.timestamp - b.timestamp);

  const holeAISelections = buffer.aiSelectionEvents
    .filter(e => e.holeNumber === holeNumber)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (holeOptimizerEvents.length === 0) {
    console.log(`[RoundEventTracker] No optimizer events for hole ${holeNumber} — skipping inference.`);
    return null;
  }

  const result = inferHoleShots({
    roundId: buffer.roundId,
    userId,
    holeNumber,
    par,
    optimizerEvents: holeOptimizerEvents,
    aiSelections: holeAISelections,
    holeScore: holeScoreEvent,
  });

  // Persist inferred shots and hole analytics to Firestore
  const firestoreDb = getDb();
  const batch = writeBatch(firestoreDb);

  for (const shot of result.shots) {
    const ref = doc(collection(firestoreDb, 'inferredShots'), shot.shotId);
    batch.set(ref, { ...shot, createdAt: serverTimestamp() });
  }

  const holeAnalyticsRef = doc(
    collection(firestoreDb, 'holeAnalytics'),
    `${buffer.roundId}_hole${holeNumber}`
  );
  batch.set(holeAnalyticsRef, {
    ...result.holeAnalytics,
    shots: result.shots.map(s => s.shotId),
    createdAt: serverTimestamp(),
  });

  batch.commit().catch(e =>
    console.warn('[RoundEventTracker] Firestore batch write failed:', e)
  );

  console.log(
    `[RoundEventTracker] Hole ${holeNumber} processed: ` +
    `${result.shots.length} shots inferred, ` +
    `${result.holeAnalytics.shotsFollowedAI}/${result.holeAnalytics.shotsWithAI} followed AI`
  );

  return result;
}

export async function clearRoundTracker(): Promise<void> {
  buffer = null;
  localStorage.removeItem(BUFFER_KEY);
  console.log('[RoundEventTracker] Buffer cleared.');
}

export function getBufferState(): EventBuffer | null {
  return buffer;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function normalizeClubName(club: string): string {
  return club
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace('iron', 'i')
    .replace('wood', 'w')
    .replace('hybrid', 'h')
    .replace('wedge', 'w')
    .replace('pitching', 'pw')
    .replace('sand', 'sw')
    .replace('gap', 'gw')
    .replace('lob', 'lw');
}
