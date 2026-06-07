/** One-off diagnostic: dump Ken's uiEvents for the Flagstaff round. No writes. */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const snap = await db
  .collection('uiEvents')
  .where('roundId', '==', 'round_1780761561646_LLgp47ZoB84M')
  .get();
const rows = snap.docs
  .map((d) => d.data())
  .sort((a, b) => String(a.timestamp) < String(b.timestamp) ? -1 : 1);
for (const v of rows) {
  const ts = v.timestamp?.toDate?.() ?? v.timestamp;
  console.log(`${ts}  hole=${v.holeNumber}  ${v.eventType}  ${JSON.stringify(v.metadata ?? {})}`);
}
