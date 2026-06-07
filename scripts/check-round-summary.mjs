/**
 * One-off diagnostic: find a user by name, list their recent rounds (scores),
 * and report whether a roundSummaries doc exists for each. No writes.
 *
 * Usage: node scripts/check-round-summary.mjs "Ken Overton" [courseFilter]
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

const nameQuery = (process.argv[2] ?? 'Ken Overton').toLowerCase();
const courseFilter = (process.argv[3] ?? '').toLowerCase();

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

// --- find matching users (scan; name field varies) ---
const usersSnap = await db.collection('users').get();
const matches = [];
for (const d of usersSnap.docs) {
  const v = d.data();
  const hay = [v.displayName, v.name, v.firstName && `${v.firstName} ${v.lastName ?? ''}`, v.email]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase();
  if (hay.includes(nameQuery) || nameQuery.split(' ').every((p) => hay.includes(p))) {
    matches.push({ uid: d.id, label: hay });
  }
}

if (!matches.length) {
  console.log(`No users matched "${nameQuery}" out of ${usersSnap.size} user docs.`);
  process.exit(0);
}

for (const u of matches) {
  console.log(`\n=== user ${u.uid} (${u.label}) ===`);
  const scoresSnap = await db
    .collection('scores')
    .where('userId', '==', u.uid)
    .get();
  const rounds = scoresSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => !courseFilter || (r.course?.name ?? '').toLowerCase().includes(courseFilter))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  console.log(`rounds (scores docs): ${scoresSnap.size}${courseFilter ? `, matching "${courseFilter}": ${rounds.length}` : ''}`);
  for (const r of rounds.slice(0, 15)) {
    const summaryDoc = await db.collection('roundSummaries').doc(r.id).get();
    // also check summaries keyed differently (by roundId field)
    let altSummary = null;
    if (!summaryDoc.exists) {
      const alt = await db
        .collection('roundSummaries')
        .where('userId', '==', u.uid)
        .where('roundId', '==', r.id)
        .get();
      if (!alt.empty) altSummary = alt.docs[0].id;
    }
    console.log(
      `  ${r.date ?? '????-??-??'}  ${r.course?.name ?? '(unknown course)'}  [scores/${r.id}]` +
        `  summary: ${summaryDoc.exists ? 'YES (doc id = round id)' : altSummary ? `YES (doc ${altSummary})` : 'NO'}`
    );
  }
  // any summaries for this user at all?
  const allSummaries = await db.collection('roundSummaries').where('userId', '==', u.uid).get();
  console.log(`roundSummaries docs for user: ${allSummaries.size}`);
  for (const s of allSummaries.docs.slice(0, 10)) {
    const v = s.data();
    console.log(`  - ${s.id}  date=${v.date ?? '?'} course=${v.courseName ?? v.course?.name ?? '?'}`);
  }
}
