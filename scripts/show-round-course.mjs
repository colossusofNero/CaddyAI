/**
 * Inspect a round and generate a per-hole coordinate template for its course.
 *
 * Reads scores/{roundId} (falls back to rounds/{roundId}), prints the courseId,
 * course name and the scorecard (par + yardage per hole), then writes a
 * fill-in template to scripts/course-coords/<courseId>.json with blank
 * teeBox/greenCenter for each hole. Fill in lat/lng from Google Maps, then run
 * scripts/seed-course-coords.mjs to write it into courses/{courseId}.
 *
 * Usage: node scripts/show-round-course.mjs <roundId>
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

config({ path: '.env.local' });
if (!getApps().length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.error('FIREBASE_SERVICE_ACCOUNT not set in .env.local'); process.exit(1); }
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const ROUND_ID = process.argv[2];
if (!ROUND_ID) { console.error('usage: node scripts/show-round-course.mjs <roundId>'); process.exit(1); }

// Load round from scores (mobile) then rounds (web). Normalize to {courseId, courseName, holes[]}.
let courseId, courseName, holes;
const scoreSnap = await db.collection('scores').doc(ROUND_ID).get();
if (scoreSnap.exists) {
  const v = scoreSnap.data();
  courseId = v.course?.id;
  courseName = v.course?.name ?? '(unknown course)';
  holes = (v.holes ?? []).map(h => ({ number: h.holeNumber, par: h.par, distance: h.yardage }));
} else {
  const roundSnap = await db.collection('rounds').doc(ROUND_ID).get();
  if (!roundSnap.exists) { console.error(`round not found in scores or rounds: ${ROUND_ID}`); process.exit(1); }
  const v = roundSnap.data();
  courseId = v.courseId;
  courseName = v.courseName ?? '(unknown course)';
  holes = (v.holes ?? []).map(h => ({ number: h.holeNumber, par: h.par, distance: h.yardage }));
}
holes.sort((a, b) => a.number - b.number);

console.log(`\nRound:       ${ROUND_ID}`);
console.log(`Course name: ${courseName}`);
console.log(`Course id:   ${courseId ?? '(MISSING — round has no course.id; map cannot match a courses doc)'}`);
console.log(`Holes:       ${holes.length}`);
console.log('\n  #  par  yds');
for (const h of holes) console.log(`  ${String(h.number).padStart(2)}  ${String(h.par ?? '').padStart(3)}  ${String(h.distance ?? '').padStart(3)}`);

if (courseId) {
  const cSnap = await db.collection('courses').doc(courseId).get();
  console.log(`\ncourses/${courseId} exists: ${cSnap.exists}`);
  if (cSnap.exists) {
    const c = cSnap.data();
    const withGeo = (c.holes ?? []).filter(h => h.gpsData?.teeBox && h.gpsData?.greenCenter).length;
    console.log(`  holes in course doc: ${(c.holes ?? []).length}, with tee+green geometry: ${withGeo}`);
  }
}

// Write a fill-in template.
const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, 'course-coords');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const slug = courseId || ROUND_ID;
const outPath = resolve(outDir, `${slug}.json`);
const template = {
  courseId: courseId || '<<SET-A-COURSE-ID>>',
  courseName,
  roundId: ROUND_ID,
  _instructions: 'For each hole, fill teeBox + greenCenter from Google Maps (right-click a point -> the lat/lng appears; click it to copy). distance is auto-filled from your scorecard; adjust if you like.',
  holes: holes.map(h => ({
    number: h.number,
    par: h.par ?? null,
    distance: h.distance ?? null,
    gpsData: {
      teeBox: { latitude: null, longitude: null },
      greenCenter: { latitude: null, longitude: null },
    },
  })),
};
if (existsSync(outPath)) {
  console.log(`\n! template already exists, not overwriting: ${outPath}`);
} else {
  writeFileSync(outPath, JSON.stringify(template, null, 2));
  console.log(`\n✓ wrote fill-in template: ${outPath}`);
}
process.exit(0);
