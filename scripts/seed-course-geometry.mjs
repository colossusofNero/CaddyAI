/**
 * Batch-generate per-hole geometry (fairway corridor + green circle) for an
 * ENTIRE course and write /courseHoles/{courseId}_h{N} docs — the same
 * procedural pipeline as seed-hole-geometry.mjs, run over every hole.
 *
 * Pulls tee/green/par from courses/{courseId}.holes[].gpsData. Keyed by the
 * courses doc id so loadRound can fetch by course.id.
 *
 * Usage: node scripts/seed-course-geometry.mjs <courseId> [fairwayWidthYds]
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const COURSE_ID = process.argv[2];
const FAIRWAY_WIDTH_YDS = Number(process.argv[3] ?? 38);
const FAIRWAY_START_YDS = 20;
const FAIRWAY_END_OFFSET_YDS = 25;
const GREEN_RADIUS_YDS = 13;
const GREEN_VERTICES = 16;
if (!COURSE_ID) { console.error('usage: node scripts/seed-course-geometry.mjs <courseId> [fairwayWidthYds]'); process.exit(1); }

const EARTH_RADIUS_M = 6371000, M_PER_YARD = 0.9144;
const toRad = d => (d * Math.PI) / 180, toDeg = r => (r * 180) / Math.PI;
function destinationPoint(o, brgDeg, yd) {
  const ang = (yd * M_PER_YARD) / EARTH_RADIUS_M, brg = toRad(brgDeg), la1 = toRad(o.latitude), ln1 = toRad(o.longitude);
  const sl = Math.sin(la1) * Math.cos(ang) + Math.cos(la1) * Math.sin(ang) * Math.cos(brg);
  const la2 = Math.asin(sl), y = Math.sin(brg) * Math.sin(ang) * Math.cos(la1), x = Math.cos(ang) - Math.sin(la1) * sl;
  const ln2 = ln1 + Math.atan2(y, x);
  return { latitude: toDeg(la2), longitude: ((toDeg(ln2) + 540) % 360) - 180 };
}
function bearingBetween(a, b) {
  const la1 = toRad(a.latitude), la2 = toRad(b.latitude), dl = toRad(b.longitude - a.longitude);
  const y = Math.sin(dl) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
function distanceYards(a, b) {
  const dLat = toRad(b.latitude - a.latitude), dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return (2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))) / M_PER_YARD;
}
function fairway(tee, brg, startYds, endYds, widthYds) {
  const hw = widthYds / 2, front = destinationPoint(tee, brg, startYds), back = destinationPoint(tee, brg, endYds);
  return [
    destinationPoint(front, brg - 90, hw),
    destinationPoint(front, brg + 90, hw),
    destinationPoint(back, brg + 90, hw),
    destinationPoint(back, brg - 90, hw),
  ];
}
function greenCircle(center, r, n) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(destinationPoint(center, (i / n) * 360, r));
  return pts;
}

const snap = await db.collection('courses').doc(COURSE_ID).get();
if (!snap.exists) { console.error('course not found: ' + COURSE_ID); process.exit(1); }
const course = snap.data();
const courseName = course.courseName ?? course.name ?? COURSE_ID;
const holes = (course.holes ?? []).filter(h => h.number && h.gpsData?.teeBox && h.gpsData?.greenCenter);
console.log(`${courseName} (${COURSE_ID}) — ${holes.length} holes with geometry`);

const batch = db.batch();
let n = 0;
for (const h of holes) {
  const tee = h.gpsData.teeBox, green = h.gpsData.greenCenter;
  const brg = bearingBetween(tee, green);
  const len = distanceYards(tee, green);
  const fwEnd = Math.max(FAIRWAY_START_YDS + 10, len - FAIRWAY_END_OFFSET_YDS);
  const doc = {
    courseId: COURSE_ID,
    holeNumber: h.number,
    par: h.par ?? 4,
    teeBoxes: [{ color: 'default', position: tee }],
    greenCenter: green,
    greenPolygon: greenCircle(green, GREEN_RADIUS_YDS, GREEN_VERTICES),
    fairwayPolygon: fairway(tee, brg, FAIRWAY_START_YDS, fwEnd, FAIRWAY_WIDTH_YDS),
    hazards: [],
    targetLine: { tee, aim: green },
    generatedFrom: {
      bearingDeg: Math.round(brg * 10) / 10,
      holeLengthYards: Math.round(len),
      fairwayWidthYards: FAIRWAY_WIDTH_YDS,
      fairwayStartYards: FAIRWAY_START_YDS,
      fairwayEndYards: Math.round(fwEnd),
      greenRadiusYards: GREEN_RADIUS_YDS,
      greenVertices: GREEN_VERTICES,
      pipeline: 'seed-course-geometry',
    },
    isDemo: true,
    updatedAt: Date.now(),
  };
  batch.set(db.collection('courseHoles').doc(`${COURSE_ID}_h${h.number}`), doc);
  n++;
}
await batch.commit();
console.log(`✓ wrote ${n} courseHoles docs (${COURSE_ID}_h1..) — fairway ${FAIRWAY_WIDTH_YDS}y wide`);
