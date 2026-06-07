/**
 * One-off diagnostic: Ken Overton's docs in `rounds`, plus all roundSummaries.
 * No writes.
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const uid = 's8SgVehYX3WIVqTi04VFrUuSU662';

const roundsSnap = await db.collection('rounds').where('userId', '==', uid).get();
console.log(`rounds docs for Ken: ${roundsSnap.size}`);
for (const d of roundsSnap.docs) {
  const v = d.data();
  console.log(
    `  ${d.id}  date=${v.date ?? '?'}  course=${v.courseName ?? '?'}  completed=${v.completed}  totalShots=${v.totalShots ?? '?'}`
  );
}

console.log('\nAll roundSummaries docs:');
const summariesSnap = await db.collection('roundSummaries').get();
for (const d of summariesSnap.docs) {
  const v = d.data();
  console.log(
    `  ${d.id}  userId=${v.userId}  roundId=${v.roundId}  date=${v.date ?? '?'}  course=${v.courseName ?? '?'}  score=${v.totalScore ?? '?'}/${v.totalPar ?? '?'}`
  );
}
