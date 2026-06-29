/**
 * Write per-hole tee/green coordinates into courses/{courseId}.holes[] from a
 * fill-in template (scripts/course-coords/<courseId>.json), so loadRound() can
 * draw the real per-hole map instead of synthetic (0,0) coords.
 *
 * Generate the template with scripts/show-round-course.mjs, fill in
 * gpsData.teeBox + gpsData.greenCenter (latitude/longitude) from Google Maps,
 * then run this. Holes still left with null coords are skipped (reported).
 * Existing top-level course fields (name, etc.) are preserved via merge.
 *
 * Usage:
 *   node scripts/seed-course-coords.mjs <courseId>            # reads scripts/course-coords/<courseId>.json
 *   node scripts/seed-course-coords.mjs <courseId> <path.json>
 *   node scripts/seed-course-coords.mjs <courseId> --dry      # validate only, no write
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

config({ path: '.env.local' });

const COURSE_ID = process.argv[2];
const args = process.argv.slice(3);
const dryRun = args.includes('--dry');
const explicitPath = args.find(a => !a.startsWith('--'));
if (!COURSE_ID) { console.error('usage: node scripts/seed-course-coords.mjs <courseId> [path.json] [--dry]'); process.exit(1); }

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = explicitPath
  ? resolve(process.cwd(), explicitPath)
  : resolve(__dirname, 'course-coords', `${COURSE_ID}.json`);

let template;
try {
  template = JSON.parse(readFileSync(jsonPath, 'utf8'));
} catch (err) {
  console.error(`could not read/parse template: ${jsonPath}\n  ${err.message}`);
  process.exit(1);
}

const isNum = v => typeof v === 'number' && Number.isFinite(v);
const validCoord = c => c && isNum(c.latitude) && isNum(c.longitude)
  && Math.abs(c.latitude) <= 90 && Math.abs(c.longitude) <= 180;

const ready = [];
const skipped = [];
for (const h of template.holes ?? []) {
  const tee = h.gpsData?.teeBox, green = h.gpsData?.greenCenter;
  if (validCoord(tee) && validCoord(green)) {
    const out = { number: h.number, par: h.par ?? 4, gpsData: { teeBox: tee, greenCenter: green } };
    if (isNum(h.distance) && h.distance > 0) out.distance = h.distance;
    ready.push(out);
  } else {
    skipped.push(h.number);
  }
}

console.log(`\nCourse:   ${template.courseName ?? ''} (${COURSE_ID})`);
console.log(`Template: ${jsonPath}`);
console.log(`Ready:    ${ready.length} hole(s) with tee+green — ${ready.map(h => h.number).join(', ') || '(none)'}`);
if (skipped.length) console.log(`Skipped:  ${skipped.length} hole(s) missing coords — ${skipped.join(', ')}`);

if (!ready.length) { console.error('\nNo holes have valid coordinates. Fill in latitude/longitude and re-run.'); process.exit(1); }

if (dryRun) { console.log('\n--dry: validated only, nothing written.'); process.exit(0); }

if (!getApps().length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.error('FIREBASE_SERVICE_ACCOUNT not set in .env.local'); process.exit(1); }
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();
ready.sort((a, b) => a.number - b.number);
await db.collection('courses').doc(COURSE_ID).set({ holes: ready }, { merge: true });
console.log(`\n✓ wrote ${ready.length} holes to courses/${COURSE_ID}.holes`);
console.log('  Reload the round summary — the map should now show satellite imagery.');
console.log('  (Optional) generate fairway/green polygons: node scripts/seed-course-geometry.mjs ' + COURSE_ID);
process.exit(0);
