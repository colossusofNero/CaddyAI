/** One-off diagnostic: dump full payloads of Ken's shotEvents. No writes. */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();
const kenUid = 's8SgVehYX3WIVqTi04VFrUuSU662';

const snap = await db.collection('shotEvents').where('userId', '==', kenUid).get();
const rows = snap.docs
  .map((d) => ({ id: d.id, ...d.data() }))
  .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

for (const v of rows) {
  console.log('────────────────────────────────────────');
  console.log(`id=${v.id} round=${v.roundId} hole=${v.holeNumber} type=${v.eventType}`);
  console.log(`ts=${new Date(v.timestamp).toISOString()}`);
  console.log(`gps=${JSON.stringify(v.gpsPosition)}`);
  console.log(`payload=${JSON.stringify(v.payload, null, 2)}`);
}
