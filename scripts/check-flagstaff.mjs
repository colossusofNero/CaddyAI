/**
 * One-off diagnostic: search for Flagstaff-related rounds/scores/sessions and
 * any activity for Ken Overton's uid across event collections. No writes.
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
const needle = 'flagstaff';

// 1) rounds + scores with a Flagstaff-ish course name (any user)
const roundsSnap = await db.collection('rounds').get();
console.log(`-- rounds (${roundsSnap.size}) with "${needle}" in courseName:`);
for (const d of roundsSnap.docs) {
  const v = d.data();
  if ((v.courseName ?? '').toLowerCase().includes(needle)) {
    console.log(`  ${d.id}  user=${v.userId}  date=${v.date}  ${v.courseName}  completed=${v.completed}`);
  }
}

const scoresSnap = await db.collection('scores').get();
console.log(`-- scores (${scoresSnap.size}) with "${needle}" in course.name:`);
for (const d of scoresSnap.docs) {
  const v = d.data();
  if ((v.course?.name ?? '').toLowerCase().includes(needle)) {
    console.log(`  ${d.id}  user=${v.userId}  date=${v.date}  ${v.course?.name}`);
  }
}

// 2) Flagstaff courses in the courses collection (to match by courseId too)
const coursesSnap = await db.collection('courses').where('city', '==', 'Flagstaff').get();
console.log(`-- courses in city "Flagstaff": ${coursesSnap.size}`);
const flagCourseIds = new Set();
for (const d of coursesSnap.docs.slice(0, 20)) {
  flagCourseIds.add(d.id);
  console.log(`  ${d.id}  ${d.data().courseName}`);
}

// match rounds/scores by courseId
for (const d of roundsSnap.docs) {
  const v = d.data();
  if (v.courseId && flagCourseIds.has(v.courseId)) {
    console.log(`  [rounds by courseId] ${d.id} user=${v.userId} date=${v.date} ${v.courseName}`);
  }
}
for (const d of scoresSnap.docs) {
  const v = d.data();
  if (v.course?.id && flagCourseIds.has(v.course.id)) {
    console.log(`  [scores by courseId] ${d.id} user=${v.userId} date=${v.date} ${v.course?.name}`);
  }
}

// 3) any activity for Ken across event/session collections
for (const col of ['shotEvents', 'uiEvents', 'shotsPlayed', 'inferredShots', 'userSessions', 'jointRounds']) {
  let snap;
  try {
    snap = await db.collection(col).where('userId', '==', kenUid).limit(5).get();
  } catch {
    snap = { size: 'query failed', docs: [] };
  }
  console.log(`-- ${col} for Ken: ${snap.size}`);
  for (const d of snap.docs ?? []) {
    const v = d.data();
    console.log(`  ${d.id}  round=${v.roundId ?? v.course_name ?? ''}  ts=${v.timestamp?.toDate?.() ?? v.timestamp ?? ''}`);
  }
}

// userSessions uses snake_case + course_name
const sessSnap = await db.collection('userSessions').get();
console.log(`-- userSessions (${sessSnap.size}) mentioning "${needle}":`);
for (const d of sessSnap.docs) {
  const v = d.data();
  if ((v.course_name ?? '').toLowerCase().includes(needle)) {
    console.log(`  ${d.id}  course=${v.course_name}  hole=${v.hole_number}  updated=${v.updated_at?.toDate?.() ?? v.updated_at}`);
  }
}
