/**
 * Seed 10 demo optimizer calls (shotEvents) for the Flagstaff Ranch demo round
 * on Scott's account. GPS positions come from real course geometry (tee boxes),
 * each with a club recommendation — so they plot on the shot-map / caddy-recap
 * exactly like real calls. Idempotent (fixed eventIds); flagged isDemo:true.
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
const COURSE_ID = 'LLgp47ZoB84M';
// roundId suffix = course id so caddySessions resolves the course automatically
const ROUND_ID = 'round_demo_LLgp47ZoB84M';
const DAY = '2026-06-06';

const courseSnap = await db.collection('courses').doc(COURSE_ID).get();
const tee = {};
for (const h of courseSnap.data()?.holes ?? []) {
  if (h.number && h.gpsData?.teeBox) tee[h.number] = h.gpsData.teeBox;
}

// [hole, primaryClub, primaryCarry, secondaryClub, secondaryCarry, targetType, minutesIntoRound]
const CALLS = [
  [1,  'Driver', 245, '3-wood', 225, 'centerline', 0],
  [2,  'Driver', 240, '3-wood', 220, 'centerline', 18],
  [3,  '4-iron', 200, '5-iron', 190, 'pin', 33],
  [4,  'Driver', 245, '3-wood', 225, 'centerline', 50],
  [5,  'Driver', 242, '3-wood', 222, 'centerline', 70],
  [6,  'Driver', 245, '3-wood', 225, 'centerline', 88],
  [7,  '8-iron', 160, '9-iron', 148, 'pin', 105],
  [9,  'Driver', 243, '3-wood', 223, 'centerline', 130],
  [12, '5-iron', 192, '6-iron', 178, 'pin', 165],
  [15, 'Driver Fairway Finder (3/4)', 218, 'Driver - Choke Down 1"', 219, 'centerline', 205],
];

const baseMs = new Date(`${DAY}T15:30:00.000Z`).getTime();
const batch = db.batch();
let written = 0;
for (let i = 0; i < CALLS.length; i++) {
  const [hole, club, carry, alt, altCarry, target, min] = CALLS[i];
  const t = tee[hole];
  if (!t) { console.warn(`no tee geometry for hole ${hole} — skipping`); continue; }
  const ms = baseMs + min * 60000;
  const id = `demo_flagstaff_call_${String(i + 1).padStart(2, '0')}`;
  batch.set(db.collection('shotEvents').doc(id), {
    eventId: id,
    eventType: 'optimizer_run',
    userId: UID,
    roundId: ROUND_ID,
    holeNumber: hole,
    timestamp: ms,
    gpsPosition: { latitude: t.latitude, longitude: t.longitude },
    predictedLanding: null,
    actualLanding: null,
    previousEventId: null,
    payload: {
      isUsingCenterlineTarget: target === 'centerline',
      primaryClub: club,
      primaryCarryYards: carry,
      primaryFromTee: true,
      secondaryClub: alt,
      secondaryCarryYards: altCarry,
      targetType: target,
    },
    source: 'demo-seed',
    isDemo: true,
    createdAt: Timestamp.fromMillis(ms),
  });
  written++;
}
await batch.commit();
console.log(`Wrote ${written} demo optimizer calls (shotEvents) for round ${ROUND_ID}`);
console.log(`Holes: ${CALLS.map((c) => c[0]).join(', ')}`);
