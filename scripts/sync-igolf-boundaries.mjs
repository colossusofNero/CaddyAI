/**
 * Run the iGolf hole-boundary sync for specific courses — a faithful port of
 * the mobile app's pipeline (admin-dashboard/scripts/igolf-api-utils.js +
 * batch-import-courses.js extractHoleBoundary). Fetches CourseGPSVectorDetails,
 * extracts each hole's Boundary/HoleArea/Perimeter/Fairway polygon, and merges
 * it into courses/{id}.holes[].gpsData.holeBoundary — exactly where the web map
 * now reads it.
 *
 * Requires in .env.local (never hardcode — these are secrets):
 *   FIREBASE_SERVICE_ACCOUNT  (already present)
 *   IGOLF_API_KEY
 *   IGOLF_SECRET_KEY
 *   IGOLF_BASE_URL            (optional, defaults to https://api-connect.igolf.com)
 *
 * Usage: node scripts/sync-igolf-boundaries.mjs <courseId> [courseId2 ...]
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const IGOLF = {
  baseUrl: process.env.IGOLF_BASE_URL || 'https://api-connect.igolf.com',
  apiKey: process.env.IGOLF_API_KEY,
  secretKey: process.env.IGOLF_SECRET_KEY,
};
if (!IGOLF.apiKey || !IGOLF.secretKey) {
  console.error('Missing IGOLF_API_KEY / IGOLF_SECRET_KEY in .env.local — add them and re-run.');
  process.exit(1);
}

function getTimestamp() {
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const off = -now.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return `${String(now.getFullYear()).slice(-2)}${p(now.getMonth() + 1)}${p(now.getDate())}${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}${sign}${p(Math.floor(Math.abs(off) / 60))}${p(Math.abs(off) % 60)}`;
}
function sign(stringToSign) {
  return crypto.createHmac('sha256', IGOLF.secretKey).update(stringToSign).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function igolf(action, payload) {
  const ts = getTimestamp();
  const sts = `${action}/${IGOLF.apiKey}/1.1/2.0/HmacSHA256/${ts}/JSON`;
  const sig = sign(sts);
  const url = `${IGOLF.baseUrl}/rest/action/${action}/${IGOLF.apiKey}/1.1/2.0/HmacSHA256/${sig}/${ts}/JSON`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  const data = JSON.parse(text);
  if (data.Status !== 1) throw new Error(data.ErrorMessage || `Status ${data.Status}: ${text.slice(0, 200)}`);
  return data.data || data;
}

function parsePolygon(s) {
  if (!s) return [];
  const out = [];
  for (const pair of String(s).split(',')) {
    const [lng, lat] = pair.trim().split(/\s+/).map(Number);
    if (!isNaN(lng) && !isNaN(lat)) out.push({ latitude: lat, longitude: lng });
  }
  return out;
}
function extractHoleBoundary(vgo, holeNumber) {
  const root = vgo?.vectorGPSObject || vgo;
  if (!root?.Holes?.Hole) return { pts: null, field: null };
  const holes = Array.isArray(root.Holes.Hole) ? root.Holes.Hole : [root.Holes.Hole];
  const h = holes[holeNumber - 1];
  if (!h) return { pts: null, field: null };
  let shapes = null, field = null;
  if (h.Boundary?.Shapes?.Shape) { shapes = h.Boundary.Shapes.Shape; field = 'Boundary'; }
  else if (h.HoleArea?.Shapes?.Shape) { shapes = h.HoleArea.Shapes.Shape; field = 'HoleArea'; }
  else if (h.Perimeter?.Shapes?.Shape) { shapes = h.Perimeter.Shapes.Shape; field = 'Perimeter'; }
  else if (h.Fairway?.Shapes?.Shape) { shapes = h.Fairway.Shapes.Shape; field = 'Fairway'; }
  if (!shapes) return { pts: null, field: null };
  const arr = Array.isArray(shapes) ? shapes : [shapes];
  if (arr[0]?.Points) { const pts = parsePolygon(arr[0].Points); if (pts.length >= 3) return { pts, field }; }
  return { pts: null, field };
}

const courseIds = process.argv.slice(2);
if (!courseIds.length) { console.error('usage: node scripts/sync-igolf-boundaries.mjs <courseId> [...]'); process.exit(1); }

for (const courseId of courseIds) {
  console.log(`\n=== ${courseId} ===`);
  const snap = await db.collection('courses').doc(courseId).get();
  if (!snap.exists) { console.log('  course doc not found, skipping'); continue; }
  const data = snap.data();
  console.log(`  ${data.name} (source=${data.source}) — ${(data.holes || []).length} holes`);

  let vector;
  try {
    vector = await igolf('CourseGPSVectorDetails', { id_course: courseId });
  } catch (e) {
    console.log(`  ✗ vector fetch failed with doc id: ${e.message}`);
    console.log('  (the doc id may not be the iGolf id_course — would need a CourseList lookup by location)');
    continue;
  }
  const root = vector?.vectorGPSObject || vector;
  console.log('  vector top-level keys:', Object.keys(root || {}).join(', '));

  const holes = (data.holes || []).map((h) => {
    const { pts, field } = extractHoleBoundary(vector, h.number);
    if (pts) {
      console.log(`  hole ${h.number}: ${pts.length} pts from ${field}`);
      return { ...h, gpsData: { ...(h.gpsData || {}), holeBoundary: pts } };
    }
    return h;
  });
  const got = holes.filter((h) => h.gpsData?.holeBoundary).length;
  if (got > 0) {
    await db.collection('courses').doc(courseId).set({ holes, vectorSyncedAt: Date.now() }, { merge: true });
    console.log(`  ✓ wrote holeBoundary for ${got}/${holes.length} holes`);
  } else {
    console.log('  ⚠ no boundaries extracted (iGolf returned no Boundary/HoleArea/Perimeter/Fairway for these holes)');
  }
}
console.log('\ndone');
