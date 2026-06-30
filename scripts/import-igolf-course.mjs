/**
 * Import full per-hole geometry for a course from iGolf into
 * courses/{courseId}.holes[], so the Round Summary map lights up.
 *
 * For each hole it writes:
 *   number, par (from CourseScorecardDetails), distance (Back-tee yards),
 *   gpsData.teeBox      (Teeboxcenter point matching the played tee),
 *   gpsData.greenCenter (Greencenter point),
 *   gpsData.holeBoundary(Perimeter polygon — drives the fairway overlay).
 *
 * Tee selection: each hole's Teeboxcenter has several tees; we pick the one
 * whose great-circle distance to the green best matches the tee yardage, so the
 * map tee marker matches the scorecard.
 *
 * Reads IGOLF_API_KEY / IGOLF_SECRET_KEY and FIREBASE_SERVICE_ACCOUNT from
 * .env.local. Pass --dry to preview without writing.
 *
 * Usage: node scripts/import-igolf-course.mjs <courseId> [teeName] [--dry]
 *        teeName defaults to "Back".
 */
import { config } from 'dotenv';
import crypto from 'crypto';
config({ path: '.env.local' });

const COURSE_ID = process.argv[2];
const restArgs = process.argv.slice(3);
const DRY = restArgs.includes('--dry');
const TEE_NAME = (restArgs.find(a => !a.startsWith('--')) || 'Back');
if (!COURSE_ID) { console.error('usage: node scripts/import-igolf-course.mjs <courseId> [teeName] [--dry]'); process.exit(1); }

const API_KEY = process.env.IGOLF_API_KEY, SECRET = process.env.IGOLF_SECRET_KEY;
const BASE = process.env.IGOLF_BASE_URL || 'https://api-connect.igolf.com';
if (!API_KEY || !SECRET) { console.error('Missing IGOLF_API_KEY / IGOLF_SECRET_KEY in .env.local'); process.exit(1); }

// ---- iGolf auth (matches admin-dashboard: base64url HMAC, tz timestamp) ----
function getTimestamp() {
  const n = new Date(); const p = x => String(x).padStart(2, '0'); const off = -n.getTimezoneOffset(); const s = off >= 0 ? '+' : '-';
  return `${String(n.getFullYear()).slice(-2)}${p(n.getMonth()+1)}${p(n.getDate())}${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}${s}${p(Math.floor(Math.abs(off)/60))}${p(Math.abs(off)%60)}`;
}
function sign(s) { return crypto.createHmac('sha256', SECRET).update(s).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function igolf(action, payload) {
  const ts = getTimestamp();
  const sts = `${action}/${API_KEY}/1.1/2.0/HmacSHA256/${ts}/JSON`;
  const url = `${BASE}/rest/action/${action}/${API_KEY}/1.1/2.0/HmacSHA256/${sign(sts)}/${ts}/JSON`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = JSON.parse(await res.text());
  if (data.Status !== 1) throw new Error(`${action} -> Status ${data.Status}: ${data.ErrorMessage}`);
  return data;
}

// ---- geo + iGolf shape parsing ("lon lat" pairs, comma-separated) ----
const EARTH_M = 6371000, M_PER_YD = 0.9144, toRad = d => d * Math.PI / 180;
function distYds(a, b) {
  const dLa = toRad(b.latitude - a.latitude), dLo = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLa/2)**2 + Math.cos(toRad(a.latitude))*Math.cos(toRad(b.latitude))*Math.sin(dLo/2)**2;
  return (2*EARTH_M*Math.asin(Math.sqrt(h)))/M_PER_YD;
}
function shapes(node) { const sh = node?.Shapes?.Shape; return sh ? (Array.isArray(sh) ? sh : [sh]) : []; }
function firstPoint(node) {
  const s = shapes(node)[0]; if (!s?.Points) return null;
  const [lng, lat] = s.Points.split(',')[0].trim().split(/\s+/).map(Number);
  return (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) ? null : { latitude: lat, longitude: lng };
}
function allPoints(node) { // for Teeboxcenter (one point per shape) — drop (0,0) placeholders
  return shapes(node).map(s => { const [lng, lat] = (s.Points || '').split(',')[0].trim().split(/\s+/).map(Number); return { latitude: lat, longitude: lng }; })
    .filter(p => !isNaN(p.latitude) && !isNaN(p.longitude) && !(p.latitude === 0 && p.longitude === 0));
}
function polygon(node) {
  const s = shapes(node)[0]; if (!s?.Points) return [];
  return s.Points.split(',').map(pr => { const [lng, lat] = pr.trim().split(/\s+/).map(Number); return { latitude: lat, longitude: lng }; })
    .filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));
}

// ---- fetch ----
console.log(`Fetching iGolf data for ${COURSE_ID} (tee: ${TEE_NAME})…`);
const [vec, sc, td] = await Promise.all([
  igolf('CourseGPSVectorDetails', { id_course: COURSE_ID }),
  igolf('CourseScorecardDetails', { id_course: COURSE_ID, detailLevel: '2' }),
  igolf('CourseTeeDetails', { id_course: COURSE_ID, detailLevel: '2' }),
]);
const holesNode = vec.vectorGPSObject?.Holes?.Hole;
const vHoles = Array.isArray(holesNode) ? holesNode : (holesNode ? [holesNode] : []);
const parHole = sc.menScorecardList?.[0]?.parHole ?? [];
const tees = td.teesList ?? [];
const tee = tees.find(t => (t.teeName || '').toLowerCase() === TEE_NAME.toLowerCase()) ?? tees[0];
const ydsHole = tee?.ydsHole ?? [];
console.log(`vector holes: ${vHoles.length}, tee used: ${tee?.teeName} (${tee?.teeColorName}), total ${tee?.ydsTotal}y`);

// ---- build holes[] ----
const out = [];
for (const vh of vHoles) {
  const n = Number(vh.HoleNumber); if (!n) continue;
  const green = firstPoint(vh.Greencenter);
  const teeCandidates = allPoints(vh.Teeboxcenter);
  if (!green || !teeCandidates.length) { console.log(`  hole ${n}: missing green/tee, skipped`); continue; }
  const targetYds = ydsHole[n - 1] || 0;
  // pick tee center whose distance to green best matches the tee yardage
  const teeBox = teeCandidates.slice().sort((a, b) =>
    Math.abs(distYds(a, green) - targetYds) - Math.abs(distYds(b, green) - targetYds))[0];
  const boundary = polygon(vh.Perimeter);
  // Fairway centerline (Centralpath). Orient tee→green so dispersion measures
  // distance-to-pin ALONG the path. Reverse if the first point is the greener end.
  const centerline = polygon(vh.Centralpath);
  if (centerline.length >= 2 && distYds(centerline[0], green) < distYds(centerline[centerline.length - 1], green)) {
    centerline.reverse();
  }
  const measured = Math.round(distYds(teeBox, green));
  out.push({
    number: n,
    par: parHole[n - 1] || 4,
    distance: targetYds || measured,
    gpsData: {
      teeBox,
      greenCenter: green,
      ...(boundary.length >= 3 ? { holeBoundary: boundary } : {}),
      ...(centerline.length >= 2 ? { centerline } : {}),
    },
  });
  console.log(`  hole ${n}: par ${parHole[n-1]}, ${targetYds}y (map ${measured}y), boundary ${boundary.length}pts ${boundary.length >= 3 ? '✓' : '—'}, centerline ${centerline.length}pts`);
}
out.sort((a, b) => a.number - b.number);
console.log(`\nbuilt ${out.length} holes with tee+green geometry`);

if (DRY) { console.log('\n--dry: nothing written.'); process.exit(0); }
if (!out.length) { console.error('no holes built; aborting'); process.exit(1); }

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
if (!getApps().length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.error('FIREBASE_SERVICE_ACCOUNT not set'); process.exit(1); }
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();
await db.collection('courses').doc(COURSE_ID).set({ holes: out, vectorSyncedAt: Date.now() }, { merge: true });
console.log(`\n✓ wrote ${out.length} holes to courses/${COURSE_ID}. Reload the round summary — the map should light up.`);
process.exit(0);
