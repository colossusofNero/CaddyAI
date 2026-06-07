/**
 * Dry run: apply the auto-close scheduler's gating logic to every user's
 * caddy sessions and report what WOULD happen on the first scheduled run.
 * No writes. Validates the email-window guard against historical backfill.
 *
 * Usage: node scripts/dryrun-auto-close.mjs
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const HOUR = 3600_000;
const IDLE_MS = 4 * HOUR;
const EMAIL_MAX_AGE_MS = 24 * HOUR;
const SCAN_LOOKBACK_MS = 7 * 24 * HOUR;
const NOW = Date.now();

const YPM = 1.09361;
function distYds(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h)) * YPM;
}
const dayOf = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const sinceMs = NOW - SCAN_LOOKBACK_MS;

// active users
const activeUsers = new Set();
const recentShots = await db.collection('shotEvents').where('timestamp', '>=', sinceMs).get();
recentShots.docs.forEach((d) => activeUsers.add(d.data().userId));
const { Timestamp } = await import('firebase-admin/firestore');
const recentUi = await db.collection('uiEvents').where('createdAt', '>=', Timestamp.fromMillis(sinceMs)).get();
recentUi.docs.forEach((d) => activeUsers.add(d.data().userId));

console.log(`Active users (activity in last 7d): ${activeUsers.size}`);
console.log(`now=${new Date(NOW).toISOString()}  idle>=4h  email if idle<=24h\n`);

const geomCache = new Map();
async function loadCourse(cid) {
  if (geomCache.has(cid)) return geomCache.get(cid);
  let result = null;
  const snap = await db.collection('courses').doc(cid).get();
  if (snap.exists) {
    const v = snap.data();
    const holes = {};
    for (const h of v.holes ?? []) if (h.number) holes[h.number] = { par: h.par, distance: h.distance, green: h.gpsData?.greenCenter };
    result = { name: v.courseName ?? v.name, holes };
  }
  geomCache.set(cid, result);
  return result;
}

let totalClose = 0, totalEmail = 0, totalSilent = 0;
for (const uid of activeUsers) {
  const [shotSnap, uiSnap, scoresSnap] = await Promise.all([
    db.collection('shotEvents').where('userId', '==', uid).get(),
    db.collection('uiEvents').where('userId', '==', uid).get(),
    db.collection('scores').where('userId', '==', uid).get(),
  ]);
  const runs = shotSnap.docs.map((d) => d.data()).filter((e) => e.eventType === 'optimizer_run' && typeof e.timestamp === 'number' && e.timestamp >= sinceMs);
  const clicks = uiSnap.docs.map((d) => d.data()).filter((e) => e.eventType === 'optimizer_clicked')
    .map((e) => ({ ...e, ms: e.metadata?.timestamp ?? (typeof e.timestamp === 'number' ? e.timestamp : e.timestamp?.toDate?.().getTime()) }))
    .filter((e) => typeof e.ms === 'number' && e.ms >= sinceMs);
  const scoreDates = new Set(scoresSnap.docs.map((d) => d.data().date).filter(Boolean));

  const byDay = new Map();
  for (const r of runs) { const d = dayOf(r.timestamp); if (!byDay.has(d)) byDay.set(d, { runs: [], clicks: [] }); byDay.get(d).runs.push(r); }
  for (const c of clicks) { const d = dayOf(c.ms); if (!byDay.has(d)) byDay.set(d, { runs: [], clicks: [] }); byDay.get(d).clicks.push(c); }

  for (const [date, g] of byDay.entries()) {
    const moments = [...g.runs.map((r) => r.timestamp), ...g.clicks.map((c) => c.ms)];
    if (!moments.length) continue;
    const endTime = Math.max(...moments);
    const idle = NOW - endTime;
    const hasScore = scoreDates.has(date);

    // resolve course name for display
    const candidateIds = new Set();
    for (const e of [...g.runs, ...g.clicks]) { const s = e.roundId?.split('_')[2]; if (s && s.length >= 8) candidateIds.add(s); }
    let name;
    const sampleGps = g.runs.find((r) => r.gpsPosition)?.gpsPosition ?? null;
    for (const cid of candidateIds) {
      const c = await loadCourse(cid);
      if (!c) continue;
      if (sampleGps) { const green = Object.values(c.holes).find((h) => h.green)?.green; if (green && distYds(sampleGps, green) > 6000) continue; }
      name = c.name; break;
    }

    const idleH = (idle / HOUR).toFixed(1);
    let verdict;
    if (idle < IDLE_MS) verdict = `SKIP (idle ${idleH}h < 4h — maybe still playing)`;
    else if (hasScore) verdict = `SKIP (scorecard exists — finished)`;
    else if (idle <= EMAIL_MAX_AGE_MS) { verdict = `CLOSE + EMAIL (idle ${idleH}h)`; totalClose++; totalEmail++; }
    else { verdict = `CLOSE silently (idle ${idleH}h > 24h — backfill, no email)`; totalClose++; totalSilent++; }

    console.log(`  ${uid.slice(0, 8)}  ${date}  ${name ?? '(course?)'}  ${moments.length} asks → ${verdict}`);
  }
}
console.log(`\nTOTAL: close ${totalClose}  (email ${totalEmail}, silent backfill ${totalSilent})`);
