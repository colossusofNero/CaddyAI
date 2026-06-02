/**
 * Seed a single hole's geometry doc in /courseHoles/{holeId}.
 *
 * Edit the PARAMS block below and run:
 *   node scripts/seed-hole-geometry.mjs
 *
 * Polygons are *computed* from the parameters, not hand-traced — re-running
 * with adjusted params overwrites the doc with refined geometry. For more
 * precise polygons, swap in a manual vertex list in the geometry object
 * before .set() at the bottom.
 *
 * Reads FIREBASE_SERVICE_ACCOUNT from .env.local.
 */

import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

// ===== PARAMS =====================================================
// Edit these and re-run. Tee + green coords come from a GPS pin in
// Google Maps; the rest are tuneable so you can size the fairway and
// green to roughly match the satellite view.

const COURSE_ID = 'starfire-king';
const HOLE_NUMBER = 1;
const PAR = 5;

// 33°35'25.08"N 111°54'29.94"W (white tee)
const TEE = { latitude: 33.59030, longitude: -111.90832 };
// 33°35'38.07"N 111°54'29.03"W (green center)
const GREEN = { latitude: 33.59391, longitude: -111.90806 };

const FAIRWAY_WIDTH_YDS = 35;     // typical resort fairway
const FAIRWAY_START_YDS = 20;     // distance from tee where fairway begins
const FAIRWAY_END_OFFSET_YDS = 25; // distance short of green where fairway ends
const GREEN_RADIUS_YDS = 12;       // approx green radius (greens are 20-30 yd across)
const GREEN_VERTICES = 16;          // polygon approximating a circle

const TEE_BOXES = [
  { color: 'white', position: TEE },
  // Add others later if you have coords, e.g.
  // { color: 'blue',  position: { latitude: ..., longitude: ... } },
];

// Hand-add bunkers / water here as needed.
const HAZARDS = [
  // {
  //   type: 'sand',
  //   name: 'front-right bunker',
  //   polygon: [{ latitude: ..., longitude: ... }, ...],
  // },
];

// ===== GEO MATH ===================================================

const EARTH_RADIUS_M = 6371000;
const M_PER_YARD = 0.9144;
const toRad = d => (d * Math.PI) / 180;
const toDeg = r => (r * 180) / Math.PI;

function destinationPoint(origin, bearingDeg, distanceYards) {
  const distM = distanceYards * M_PER_YARD;
  const ang = distM / EARTH_RADIUS_M;
  const brg = toRad(bearingDeg);
  const lat1 = toRad(origin.latitude);
  const lng1 = toRad(origin.longitude);
  const sinLat2 =
    Math.sin(lat1) * Math.cos(ang) +
    Math.cos(lat1) * Math.sin(ang) * Math.cos(brg);
  const lat2 = Math.asin(sinLat2);
  const y = Math.sin(brg) * Math.sin(ang) * Math.cos(lat1);
  const x = Math.cos(ang) - Math.sin(lat1) * sinLat2;
  const lng2 = lng1 + Math.atan2(y, x);
  return {
    latitude: toDeg(lat2),
    longitude: ((toDeg(lng2) + 540) % 360) - 180,
  };
}

function bearingBetween(a, b) {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function distanceYards(a, b) {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return (2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))) / M_PER_YARD;
}

// ===== POLYGON BUILDERS ===========================================

function buildFairwayPolygon(tee, bearing, startYds, endYds, widthYds) {
  const halfWidth = widthYds / 2;
  // Walk forward to the four corners along bearing±90°
  const frontCenter = destinationPoint(tee, bearing, startYds);
  const backCenter = destinationPoint(tee, bearing, endYds);
  return [
    destinationPoint(frontCenter, bearing - 90, halfWidth), // front-left
    destinationPoint(frontCenter, bearing + 90, halfWidth), // front-right
    destinationPoint(backCenter, bearing + 90, halfWidth),  // back-right
    destinationPoint(backCenter, bearing - 90, halfWidth),  // back-left
  ];
}

function buildGreenPolygon(center, radiusYds, vertices) {
  const points = [];
  for (let i = 0; i < vertices; i++) {
    const bearing = (i / vertices) * 360;
    points.push(destinationPoint(center, bearing, radiusYds));
  }
  return points;
}

// ===== BUILD GEOMETRY =============================================

const holeBearing = bearingBetween(TEE, GREEN);
const holeLength = distanceYards(TEE, GREEN);
const fairwayEnd = Math.max(FAIRWAY_START_YDS + 10, holeLength - FAIRWAY_END_OFFSET_YDS);

const fairwayPolygon = buildFairwayPolygon(
  TEE,
  holeBearing,
  FAIRWAY_START_YDS,
  fairwayEnd,
  FAIRWAY_WIDTH_YDS
);
const greenPolygon = buildGreenPolygon(GREEN, GREEN_RADIUS_YDS, GREEN_VERTICES);

const doc = {
  courseId: COURSE_ID,
  holeNumber: HOLE_NUMBER,
  par: PAR,
  teeBoxes: TEE_BOXES,
  greenCenter: GREEN,
  greenPolygon,
  fairwayPolygon,
  hazards: HAZARDS,
  targetLine: { tee: TEE, aim: GREEN },
  generatedFrom: {
    bearingDeg: Math.round(holeBearing * 10) / 10,
    holeLengthYards: Math.round(holeLength),
    fairwayWidthYards: FAIRWAY_WIDTH_YDS,
    fairwayStartYards: FAIRWAY_START_YDS,
    fairwayEndYards: Math.round(fairwayEnd),
    greenRadiusYards: GREEN_RADIUS_YDS,
    greenVertices: GREEN_VERTICES,
  },
  updatedAt: Date.now(),
};

// ===== WRITE ======================================================

if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    console.error('FIREBASE_SERVICE_ACCOUNT not set in .env.local');
    process.exit(1);
  }
  initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
}

const db = getFirestore();
const holeId = `${COURSE_ID}_h${HOLE_NUMBER}`;

console.log(`\nSeeding /courseHoles/${holeId}:`);
console.log(`  Course:        ${COURSE_ID}`);
console.log(`  Hole:          ${HOLE_NUMBER} (par ${PAR})`);
console.log(`  Length:        ${doc.generatedFrom.holeLengthYards} yd`);
console.log(`  Bearing:       ${doc.generatedFrom.bearingDeg}°`);
console.log(`  Fairway:       ${doc.generatedFrom.fairwayStartYards}-${doc.generatedFrom.fairwayEndYards} yd, ${doc.generatedFrom.fairwayWidthYards} yd wide (4 vertices)`);
console.log(`  Green:         ${doc.generatedFrom.greenRadiusYards} yd radius (${doc.generatedFrom.greenVertices} vertices)`);
console.log(`  Hazards:       ${doc.hazards.length}`);
console.log(`  Tee boxes:     ${doc.teeBoxes.map(t => t.color).join(', ')}`);

await db.collection('courseHoles').doc(holeId).set(doc);

console.log(`\n✓ Wrote /courseHoles/${holeId}`);
process.exit(0);
