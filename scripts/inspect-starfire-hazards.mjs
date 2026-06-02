import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

const db = getFirestore();

// Search by courseName prefix using the  trick
const snap = await db.collection('courseHazards')
  .where('courseName', '>=', 'Starfire')
  .where('courseName', '<', 'Starfire' + '')
  .limit(10)
  .get();

console.log(`courseHazards 'Starfire*' matches: ${snap.size}\n`);
for (const d of snap.docs) {
  const v = d.data();
  console.log(`Doc: ${d.id}  courseId=${v.courseId}  courseName="${v.courseName}"`);
}

// Also try the courses collection
console.log('\n--- courses ---');
const csnap = await db.collection('courses')
  .where('courseName', '>=', 'Starfire')
  .where('courseName', '<', 'Starfire' + '')
  .limit(10)
  .get();
console.log(`courses 'Starfire*' matches: ${csnap.size}\n`);
for (const d of csnap.docs) {
  const v = d.data();
  console.log(`Doc: ${d.id}  "${v.courseName}"  ${v.city}, ${v.state}  holes=${v.numberOfHoles}`);
}

// If found, inspect one hazards doc deeply
if (snap.size > 0) {
  const d = snap.docs[0];
  const v = d.data();
  console.log('\n--- detail of first courseHazards doc ---');
  console.log(`Top-level keys: ${Object.keys(v).join(', ')}`);
  if (Array.isArray(v.hazards)) {
    console.log(`hazards: array(${v.hazards.length})`);
    if (v.hazards[0]) {
      console.log('first hazard:');
      console.log(JSON.stringify(v.hazards[0], null, 2).slice(0, 800));
    }
  } else if (v.hazards && typeof v.hazards === 'object') {
    console.log(`hazards keys: ${Object.keys(v.hazards).join(', ')}`);
  }
}

process.exit(0);
