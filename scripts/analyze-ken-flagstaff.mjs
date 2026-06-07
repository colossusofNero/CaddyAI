/**
 * One-off analysis: reconstruct what we can about Ken Overton's Flagstaff
 * outings from optimizer shotEvents + uiEvents + course geometry. No writes.
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

const R_EARTH_YDS = 6371000 * 1.09361;
function distYds(a, b) {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_YDS * Math.asin(Math.sqrt(h));
}

// --- course geometry for both Flagstaff courses ---
for (const cid of ['LLgp47ZoB84M', 'KMN3dP7EJajY']) {
  const c = await db.collection('courses').doc(cid).get();
  const v = c.data() ?? {};
  console.log(`course ${cid}: name=${v.courseName ?? v.name ?? '?'} holes=${(v.holes ?? []).length} gpsAvailable=${v.gpsAvailable}`);
}

const courseSnap = await db.collection('courses').doc('LLgp47ZoB84M').get();
const course = courseSnap.data() ?? {};
const holeGeom = {};
for (const h of course.holes ?? []) {
  if (h.number) holeGeom[h.number] = h;
}

// --- Ken's Flagstaff-area shotEvents (lat ~35.17) ---
const se = await db.collection('shotEvents').where('userId', '==', kenUid).get();
const flagstaffEvents = se.docs
  .map((d) => d.data())
  .filter((v) => v.gpsPosition?.latitude > 35 && v.gpsPosition?.latitude < 35.4)
  .sort((a, b) => a.timestamp - b.timestamp);

console.log(`\n=== Flagstaff optimizer runs (${flagstaffEvents.length}) ===`);
for (const ev of flagstaffEvents) {
  const g = holeGeom[ev.holeNumber];
  const green = g?.gpsData?.greenCenter;
  const tee = g?.gpsData?.teeBox;
  const dGreen = green ? distYds(ev.gpsPosition, green).toFixed(0) : '?';
  const dTee = tee ? distYds(ev.gpsPosition, tee).toFixed(0) : '?';
  const p = ev.payload ?? {};
  console.log(
    `${new Date(ev.timestamp).toISOString()}  hole ${ev.holeNumber} (par ${g?.par ?? '?'}, ${g?.distance ?? '?'}y)` +
      `\n    pos: ${dGreen}y to green center, ${dTee}y from tee` +
      `\n    rec: ${p.primaryClub} (${p.primaryCarryYards}y) / ${p.secondaryClub} (${p.secondaryCarryYards}y)  target=${p.targetType}  fromTee=${p.primaryFromTee}`
  );
}

// --- June 6 uiEvents timeline + hole pars for context ---
const ue = await db
  .collection('uiEvents')
  .where('roundId', '==', 'round_1780761561646_LLgp47ZoB84M')
  .get();
const clicks = ue.docs.map((d) => d.data()).sort((a, b) => a.metadata?.timestamp - b.metadata?.timestamp);
console.log(`\n=== June 6 optimizer clicks (${clicks.length}) ===`);
const byHole = {};
for (const c of clicks) {
  byHole[c.holeNumber] = byHole[c.holeNumber] ?? [];
  byHole[c.holeNumber].push(c.metadata?.timestamp);
}
for (const [hole, times] of Object.entries(byHole)) {
  const g = holeGeom[hole];
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  console.log(
    `hole ${hole} (par ${g?.par ?? '?'}, ${g?.distance ?? '?'}y): ${times.length} optimizer click(s), ` +
      `${first.toISOString().slice(11, 19)}–${last.toISOString().slice(11, 19)} UTC`
  );
}

// hole list for the course (pars/yardages context)
console.log('\n=== course holes (number/par/distance) ===');
for (const h of (course.holes ?? []).sort((a, b) => a.number - b.number)) {
  console.log(`  ${h.number}: par ${h.par}, ${h.distance}y, gps=${h.gpsData?.greenCenter ? 'yes' : 'no'}`);
}
