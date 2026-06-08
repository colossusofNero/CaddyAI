/**
 * Seed the Flagstaff round as a CALLS round (no fabricated scorecard).
 * The scores doc is just a marker: analysisMode:'calls' + callsRoundId pointing
 * at the 10 real optimizer-call shotEvents. loadRound() renders the round from
 * those calls — one marker per real recommendation, nothing invented.
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
const DOC_ID = 'demo-ken-flagstaff';
const DATE = '2026-06-06';

await db.collection('scores').doc(DOC_ID).set({
  userId: UID,
  course: { id: 'LLgp47ZoB84M', name: 'Flagstaff Ranch Golf Club' },
  date: DATE,
  roundType: '18',
  analysisMode: 'calls',
  callsRoundId: 'round_demo_LLgp47ZoB84M',
  isDemo: true,
  holes: [],
  stats: {},
  createdAt: Timestamp.fromDate(new Date(`${DATE}T19:20:00.000Z`)),
  updatedAt: Timestamp.now(),
});

console.log(`Wrote calls-marker scores/${DOC_ID} → callsRoundId round_demo_LLgp47ZoB84M`);
