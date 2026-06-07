/**
 * One-off validation: mirror lib/api/caddySessions.ts grouping logic with the
 * admin SDK and print what the Caddy Recap page would render for a user.
 * No writes.
 *
 * Usage: node scripts/simulate-caddy-recap.mjs [uid]
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();
const uid = process.argv[2] ?? 's8SgVehYX3WIVqTi04VFrUuSU662';

const YPM = 1.09361;
function distYds(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h)) * YPM;
}

const [shotSnap, uiSnap, scoresSnap] = await Promise.all([
  db.collection('shotEvents').where('userId', '==', uid).get(),
  db.collection('uiEvents').where('userId', '==', uid).get(),
  db.collection('scores').where('userId', '==', uid).get(),
]);

const runs = shotSnap.docs.map((d) => d.data()).filter((e) => e.eventType === 'optimizer_run' && typeof e.timestamp === 'number');
const clicks = uiSnap.docs
  .map((d) => d.data())
  .filter((e) => e.eventType === 'optimizer_clicked')
  .map((e) => ({ ...e, ms: e.metadata?.timestamp ?? (e.timestamp?.toDate ? e.timestamp.toDate().getTime() : e.timestamp) }))
  .filter((e) => typeof e.ms === 'number');
const scoreDates = new Set(scoresSnap.docs.map((d) => d.data().date).filter(Boolean));

const dayOf = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const byDay = new Map();
for (const r of runs) {
  const day = dayOf(r.timestamp);
  if (!byDay.has(day)) byDay.set(day, { runs: [], clicks: [] });
  byDay.get(day).runs.push(r);
}
for (const c of clicks) {
  const day = dayOf(c.ms);
  if (!byDay.has(day)) byDay.set(day, { runs: [], clicks: [] });
  byDay.get(day).clicks.push(c);
}

const geomCache = new Map();
async function loadCourse(cid) {
  if (geomCache.has(cid)) return geomCache.get(cid);
  let result = null;
  const snap = await db.collection('courses').doc(cid).get();
  if (snap.exists) {
    const v = snap.data();
    const holes = {};
    for (const h of v.holes ?? []) {
      if (!h.number) continue;
      holes[h.number] = { par: h.par, distance: h.distance, tee: h.gpsData?.teeBox, green: h.gpsData?.greenCenter };
    }
    result = { name: v.courseName ?? v.name, holes };
  }
  geomCache.set(cid, result);
  return result;
}

for (const [date, group] of [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
  const candidateIds = new Set();
  for (const e of [...group.runs, ...group.clicks]) {
    const suffix = e.roundId?.split('_')[2];
    if (suffix && suffix.length >= 8) candidateIds.add(suffix);
  }
  let courseName, holeGeom = {};
  const sampleGps = group.runs.find((r) => r.gpsPosition)?.gpsPosition ?? null;
  for (const cid of candidateIds) {
    const course = await loadCourse(cid);
    if (!course) continue;
    if (sampleGps) {
      const anyGreen = Object.values(course.holes).find((h) => h.green)?.green;
      if (anyGreen && distYds(sampleGps, anyGreen) > 6000) continue;
    }
    courseName = course.name;
    holeGeom = course.holes;
    break;
  }

  const moments = group.runs.map((r) => {
    const g = holeGeom[r.holeNumber] ?? {};
    const p = r.payload ?? {};
    return {
      ts: r.timestamp,
      hole: r.holeNumber,
      par: g.par,
      yds: g.distance,
      dGreen: r.gpsPosition && g.green ? Math.round(distYds(r.gpsPosition, g.green)) : undefined,
      club: p.primaryClub ?? p.recommendedClub,
      carry: p.primaryCarryYards ?? p.predictedCarryYards,
      alt: p.secondaryClub,
      target: p.targetType,
      detail: 'full',
    };
  });
  for (const c of group.clicks) {
    const covered = group.runs.some((r) => r.holeNumber === c.holeNumber && Math.abs(r.timestamp - c.ms) < 5000);
    if (covered) continue;
    const g = holeGeom[c.holeNumber] ?? {};
    moments.push({ ts: c.ms, hole: c.holeNumber, par: g.par, yds: g.distance, detail: 'click' });
  }
  moments.sort((a, b) => a.ts - b.ts);
  const holes = [...new Set(moments.map((m) => m.hole))];

  console.log(`\n═══ ${date} · ${courseName ?? '(course unknown)'} · ${moments.length} asks across ${holes.length} holes · scorecard: ${scoreDates.has(date) ? 'yes' : 'no'} ═══`);
  for (const m of moments) {
    const t = new Date(m.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Phoenix' });
    if (m.detail === 'click') {
      console.log(`  [click] ${t}  hole ${m.hole}${m.par ? ` (par ${m.par}, ${m.yds}y)` : ''}`);
    } else {
      console.log(
        `  [FULL]  ${t}  hole ${m.hole}${m.par ? ` (par ${m.par}, ${m.yds}y)` : ''}` +
          `${m.dGreen ? `  ${m.dGreen}y to green` : ''}  → ${m.club} (${m.carry}y)${m.alt ? ` / ${m.alt}` : ''}  [${m.target ?? '?'}]`
      );
    }
  }
}
