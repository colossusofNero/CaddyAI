import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';
import type { LatLng } from './geo';

export type ShotEventType =
  | 'optimizer_run'
  | 'ellipse_target'
  | 'ai_conversation';

export interface ShotEventInput {
  eventType: ShotEventType;
  roundId?: string | null;
  holeNumber?: number | null;
  gpsPosition?: LatLng | null;
  // Where a "perfect shot" using the recommended club is expected to land.
  // Only populate when a real bearing is known — otherwise leave null.
  predictedLanding?: LatLng | null;
  // Pointer to the prior optimizer event in this round's chain. The prior
  // event will have its actualLanding filled in with this event's origin.
  previousEventId?: string | null;
  payload: Record<string, unknown>;
}

// Returns the new event's id, or null if Firestore isn't initialized.
// Write is fire-and-forget — caller doesn't need to await.
export function recordShotEvent(input: ShotEventInput): string | null {
  if (!db) {
    console.warn('[shotEvents] Firestore not initialized — skipping');
    return null;
  }

  const userId = getAuth().currentUser?.uid ?? null;
  const ref = doc(collection(db, 'shotEvents'));

  setDoc(ref, {
    eventId: ref.id,
    eventType: input.eventType,
    userId,
    roundId: input.roundId ?? null,
    holeNumber: input.holeNumber ?? null,
    timestamp: Date.now(),
    gpsPosition: input.gpsPosition ?? null,
    predictedLanding: input.predictedLanding ?? null,
    actualLanding: null,
    actualLandedAt: null,
    previousEventId: input.previousEventId ?? null,
    payload: input.payload,
    source: 'web',
    createdAt: serverTimestamp(),
  }).catch(err => {
    console.warn('[shotEvents] write failed:', err);
  });

  return ref.id;
}

// Fill in the actual landing GPS for a prior optimizer event. Called on the
// next optimizer run, using that next call's origin as the previous shot's
// landing location. Owner-only update is permitted by firestore.rules.
export async function updateShotEventActualLanding(
  eventId: string,
  landing: LatLng
): Promise<void> {
  if (!db) return;
  try {
    await updateDoc(doc(db, 'shotEvents', eventId), {
      actualLanding: { latitude: landing.latitude, longitude: landing.longitude },
      actualLandedAt: Date.now(),
    });
  } catch (err) {
    console.warn('[shotEvents] actualLanding update failed:', err);
  }
}
