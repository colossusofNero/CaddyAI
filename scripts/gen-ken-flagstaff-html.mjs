/**
 * Generate a standalone HTML Caddy Recap for Ken Overton's Flagstaff round.
 * Pulls live shotEvents + uiEvents, joins course geometry, writes an
 * openable HTML file. No Firestore writes.
 *
 * Output: audit-reports/ken-flagstaff-recap.html
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const KEN = 's8SgVehYX3WIVqTi04VFrUuSU662';
const FLAGSTAFF_COURSE = 'LLgp47ZoB84M'; // Flagstaff Ranch Golf Club
const TZ = 'America/Phoenix';

const YPM = 1.09361;
function distYds(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h)) * YPM;
}

// course geometry
const courseSnap = await db.collection('courses').doc(FLAGSTAFF_COURSE).get();
const course = courseSnap.data() ?? {};
const courseName = course.courseName ?? course.name ?? 'Flagstaff Ranch Golf Club';
const holeGeom = {};
for (const h of course.holes ?? []) if (h.number) holeGeom[h.number] = h;

// Ken's Flagstaff-area events (lat ~35.1x). June 6 round.
const shotSnap = await db.collection('shotEvents').where('userId', '==', KEN).get();
const flagRuns = shotSnap.docs
  .map((d) => d.data())
  .filter((v) => v.gpsPosition?.latitude > 35 && v.gpsPosition?.latitude < 35.4 && v.eventType === 'optimizer_run');

const uiSnap = await db.collection('uiEvents').where('userId', '==', KEN).get();
const june6Clicks = uiSnap.docs
  .map((d) => d.data())
  .filter((v) => v.roundId === 'round_1780761561646_LLgp47ZoB84M' && v.eventType === 'optimizer_clicked')
  .map((v) => ({ ms: v.metadata?.timestamp ?? v.timestamp, hole: v.holeNumber }));

// Build moments for the June 6 round (the main Flagstaff outing)
const DAY = '2026-06-06';
const isJune6 = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: TZ }) === DAY;

const moments = [];
for (const r of flagRuns) {
  if (!isJune6(r.timestamp)) continue;
  const g = holeGeom[r.holeNumber] ?? {};
  const p = r.payload ?? {};
  moments.push({
    ms: r.timestamp,
    hole: r.holeNumber,
    par: g.par,
    yds: g.distance,
    dGreen: r.gpsPosition && g.gpsData?.greenCenter ? Math.round(distYds(r.gpsPosition, g.gpsData.greenCenter)) : null,
    club: p.primaryClub ?? p.recommendedClub,
    carry: p.primaryCarryYards ?? p.predictedCarryYards,
    alt: p.secondaryClub,
    altCarry: p.secondaryCarryYards,
    target: p.targetType,
    fromTee: p.primaryFromTee,
    detail: 'full',
  });
}
for (const c of june6Clicks) {
  if (!isJune6(c.ms)) continue;
  const covered = moments.some((m) => m.detail === 'full' && m.hole === c.hole && Math.abs(m.ms - c.ms) < 5000);
  if (covered) continue;
  const g = holeGeom[c.hole] ?? {};
  moments.push({ ms: c.ms, hole: c.hole, par: g.par, yds: g.distance, detail: 'click' });
}
moments.sort((a, b) => a.ms - b.ms);

// group display by hole, in play order (15,16,17,1)
const holeOrder = [...new Set(moments.map((m) => m.hole))];
const startMs = Math.min(...moments.map((m) => m.ms));
const endMs = Math.max(...moments.map((m) => m.ms));
const durationMin = Math.round((endMs - startMs) / 60000);
const fmtTime = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function holeBlock(hole) {
  const ms = moments.filter((m) => m.hole === hole);
  const g = holeGeom[hole] ?? {};
  const full = ms.filter((m) => m.detail === 'full');
  const clickCount = ms.filter((m) => m.detail === 'click').length + full.length;
  const first = Math.min(...ms.map((m) => m.ms));
  const last = Math.max(...ms.map((m) => m.ms));

  let cards = '';
  for (const m of full) {
    cards += `
      <div class="rec">
        <div class="rec-top">
          <span class="club">${esc(m.club)}</span>
          ${m.carry ? `<span class="carry">${m.carry}y carry</span>` : ''}
          <span class="time">${fmtTime(m.ms)}</span>
        </div>
        ${m.dGreen != null ? `<div class="measured">We measured <b>${m.dGreen}y to the green</b>${m.fromTee ? ' from the tee' : ''} and ${m.target === 'centerline' ? 'read the landing zones' : 'lined you up at the pin'}.</div>` : ''}
        ${m.alt ? `<div class="backup">Backup: ${esc(m.alt)}${m.altCarry ? ` · ${m.altCarry}y` : ''}</div>` : ''}
        <div class="tagline">That's the math you didn't have to do.</div>
      </div>`;
  }
  if (full.length === 0) {
    cards = `<div class="clickonly">You asked your caddy <b>${clickCount}×</b> here — we ran the numbers each time.</div>`;
  } else if (clickCount > full.length) {
    cards += `<div class="more-asks">+ ${clickCount - full.length} more ask${clickCount - full.length === 1 ? '' : 's'} on this hole</div>`;
  }

  return `
    <div class="hole">
      <div class="hole-head">
        <div class="hole-num">${hole}</div>
        <div class="hole-meta">
          <div class="hole-title">Hole ${hole}${g.par ? ` · Par ${g.par}` : ''}${g.distance ? ` · ${g.distance}y` : ''}</div>
          <div class="hole-sub">${fmtTime(first)}${last !== first ? `–${fmtTime(last)}` : ''} · ${clickCount} caddy ask${clickCount === 1 ? '' : 's'}</div>
        </div>
      </div>
      ${cards}
    </div>`;
}

const totalAsks = moments.length;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Caddy Recap — Ken Overton · Flagstaff Ranch</title>
<style>
  :root {
    --bg:#FDF8F3; --card:#fff; --ink:#1c1917; --muted:#78716c;
    --primary:#15803d; --primary-soft:#dcfce7; --border:#e7e2da; --accent:#b45309;
  }
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:var(--bg); color:var(--ink); line-height:1.5; }
  .wrap { max-width:760px; margin:0 auto; padding:28px 18px 60px; }
  .badge { display:inline-block; font-size:12px; letter-spacing:.08em; text-transform:uppercase;
    color:var(--primary); background:var(--primary-soft); padding:4px 10px; border-radius:999px; font-weight:600; }
  h1 { font-size:26px; margin:14px 0 4px; }
  .sub { color:var(--muted); font-size:15px; margin-bottom:22px; }
  .stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:26px; }
  .stat { flex:1; min-width:120px; background:var(--card); border:1px solid var(--border);
    border-radius:14px; padding:14px 16px; }
  .stat .n { font-size:24px; font-weight:700; color:var(--primary); }
  .stat .l { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
  .hole { background:var(--card); border:1px solid var(--border); border-radius:16px;
    padding:16px 18px; margin-bottom:14px; }
  .hole-head { display:flex; align-items:center; gap:14px; margin-bottom:10px; }
  .hole-num { width:42px; height:42px; border-radius:50%; background:var(--primary); color:#fff;
    display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; flex:none; }
  .hole-title { font-weight:650; font-size:16px; }
  .hole-sub { color:var(--muted); font-size:13px; }
  .rec { border:1px solid var(--border); border-radius:12px; padding:12px 14px; margin-top:8px;
    background:#fcfbf9; }
  .rec-top { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .club { font-weight:700; color:var(--primary); font-size:15px; }
  .carry { font-size:13px; color:var(--ink); background:var(--primary-soft); padding:2px 8px; border-radius:6px; }
  .time { margin-left:auto; color:var(--muted); font-size:13px; }
  .measured { margin-top:8px; font-size:14px; color:#44403c; }
  .backup { margin-top:5px; font-size:13px; color:var(--muted); }
  .tagline { margin-top:8px; font-size:12.5px; font-style:italic; color:var(--accent); }
  .clickonly { font-size:14px; color:#44403c; }
  .more-asks { margin-top:8px; font-size:13px; color:var(--muted); }
  .ladder { margin-top:24px; background:var(--primary-soft); border:1px solid #bbf7d0;
    border-radius:14px; padding:16px 18px; font-size:14.5px; }
  .ladder b { color:var(--primary); }
  .foot { margin-top:30px; text-align:center; color:var(--muted); font-size:12px; }
  .src { margin-top:6px; font-size:11px; }
</style>
</head>
<body>
  <div class="wrap">
    <span class="badge">Caddy Recap</span>
    <h1>${esc(courseName)}</h1>
    <div class="sub">Ken Overton · Saturday, June 6, 2026 · ${durationMin} min on course · <b>round not scored</b></div>

    <div class="stats">
      <div class="stat"><div class="n">${totalAsks}</div><div class="l">Caddy asks</div></div>
      <div class="stat"><div class="n">${holeOrder.length}</div><div class="l">Holes engaged</div></div>
      <div class="stat"><div class="n">${fmtTime(startMs)}</div><div class="l">First ask</div></div>
      <div class="stat"><div class="n">${fmtTime(endMs)}</div><div class="l">Last ask</div></div>
    </div>

    ${holeOrder.map(holeBlock).join('')}

    <div class="ladder">
      <b>This is just a glimpse.</b> Ken leaned on the caddy ${totalAsks} times but never logged a scorecard —
      so we can't yet show how each decision played out. Log scores next round and the full round summary
      unlocks: dispersion, club performance, and shot-by-shot outcomes.
    </div>

    <div class="foot">
      Generated from on-course optimizer activity (shotEvents + uiEvents) joined to course geometry.
      <div class="src">Most asks here are click-only (the recommendation payload didn't persist) — a known mobile capture gap.</div>
    </div>
  </div>
</body>
</html>`;

const out = 'audit-reports/ken-flagstaff-recap.html';
writeFileSync(out, html);
console.log(`Wrote ${out}`);
console.log(`Round: ${courseName} · ${totalAsks} asks across holes ${holeOrder.join(', ')} · ${durationMin} min`);
