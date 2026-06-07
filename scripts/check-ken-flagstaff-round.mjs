/**
 * One-off diagnostic: inspect Ken's Flagstaff round docs + event counts. No writes.
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();
const kenUid = 's8SgVehYX3WIVqTi04VFrUuSU662';

const roundIds = [
  'round_1780761561706_1fh310uko',
  'round_1780761561646_LLgp47ZoB84M',
  'round_1780520232941_ypfzmn7d5',
];

for (const rid of roundIds) {
  console.log(`\n=== ${rid} ===`);
  const doc = await db.collection('rounds').doc(rid).get();
  if (doc.exists) {
    const v = doc.data();
    console.log(`  rounds doc EXISTS: user=${v.userId} date=${v.date} course=${v.courseName} completed=${v.completed} totalShots=${v.totalShots} shots=${Array.isArray(v.shots) ? v.shots.length : '?'}`);
  } else {
    console.log('  rounds doc: MISSING');
  }
  const summary = await db.collection('roundSummaries').doc(rid).get();
  console.log(`  roundSummaries doc: ${summary.exists ? 'EXISTS' : 'MISSING'}`);
  const altSummary = await db.collection('roundSummaries').where('roundId', '==', rid).get();
  console.log(`  roundSummaries by roundId field: ${altSummary.size}`);
  const se = await db.collection('shotEvents').where('roundId', '==', rid).get();
  console.log(`  shotEvents: ${se.size}`);
  const ue = await db.collection('uiEvents').where('roundId', '==', rid).get();
  console.log(`  uiEvents: ${ue.size}`);
  // event types breakdown for shotEvents
  const types = {};
  for (const d of se.docs) {
    const t = d.data().eventType ?? '?';
    types[t] = (types[t] ?? 0) + 1;
  }
  if (se.size) console.log('  shotEvent types:', JSON.stringify(types));
  // hole coverage
  const holes = new Set(se.docs.map((d) => d.data().holeNumber).filter(Boolean));
  if (holes.size) console.log('  holes with shotEvents:', [...holes].sort((a, b) => a - b).join(','));
}

// Also: all of Ken's shotEvents round ids + any scores docs created today
const kenEvents = await db.collection('shotEvents').where('userId', '==', kenUid).get();
const byRound = {};
for (const d of kenEvents.docs) {
  const rid = d.data().roundId ?? '?';
  byRound[rid] = (byRound[rid] ?? 0) + 1;
}
console.log('\nKen shotEvents by roundId:', JSON.stringify(byRound, null, 2));

const kenUi = await db.collection('uiEvents').where('userId', '==', kenUid).get();
const uiByRound = {};
for (const d of kenUi.docs) {
  const rid = d.data().roundId ?? '?';
  uiByRound[rid] = (uiByRound[rid] ?? 0) + 1;
}
console.log('Ken uiEvents by roundId:', JSON.stringify(uiByRound, null, 2));
