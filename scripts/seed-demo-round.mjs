/**
 * Seed the "The King - Starfire" demo round as a real /scores doc on Scott's
 * account, so it appears in the dashboard, history, scores list, and the
 * round-summary map+dispersion view — a showcase round until real ones exist.
 *
 * Idempotent: fixed doc id `demo-king-starfire`. Re-running overwrites it.
 * Marked `isDemo: true` so it's easy to find/remove later.
 *
 * Data mirrors lib/demo/kingRound.ts (par 70, gross 95, +25) at course
 * oYEPmjf4lKJK, whose per-hole GPS geometry makes the round-summary map render.
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

config({ path: '.env.local' });
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const UID = 'ZOR4qaBeDeUQL9X7bfjUTyaTyIo2'; // scott.roelofs@rcgvaluation.com
const DOC_ID = 'demo-king-starfire';
const COURSE = { id: 'oYEPmjf4lKJK', name: 'The King - Starfire Golf Club' };
const DATE = '2026-06-05';

// Realistic bogey-golfer scorecard for the showcase: par 70, gross 95 (+25),
// GIR 5/18, FIR 7/12, 3 three-putts. Yardages from kingRound.ts. Each hole is
// internally consistent — a GIR bogey means green-in-reg then a 3-putt, which
// is exactly how a ~20-handicap makes bogeys.
// [par, yardage, score, putts, fairwayHit(null=par3), greenInRegulation, penalties]
const RAW = [
  [5, 559, 7, 2, false, false, 0],
  [3, 188, 4, 2, null,  false, 0],
  [4, 421, 5, 3, true,  true,  0], // GIR, 3-putt bogey
  [3, 144, 3, 2, null,  true,  0], // GIR par
  [4, 349, 5, 2, true,  false, 0],
  [5, 498, 7, 2, false, false, 0],
  [4, 400, 5, 2, false, false, 0],
  [3, 203, 5, 2, null,  false, 1],
  [5, 504, 6, 3, true,  true,  0], // GIR, 3-putt bogey
  [3, 197, 4, 2, null,  false, 0],
  [4, 396, 5, 3, true,  true,  0], // GIR, 3-putt bogey
  [4, 339, 7, 2, false, false, 0],
  [5, 479, 7, 2, false, false, 1],
  [3, 169, 4, 2, null,  false, 0],
  [4, 385, 4, 2, true,  true,  0], // GIR par
  [4, 369, 7, 2, true,  false, 0],
  [3, 153, 4, 2, null,  false, 0],
  [4, 353, 6, 2, false, false, 0],
];

const holes = RAW.map(([par, yardage, strokes, putts, fairwayHit, greenInRegulation, penalties], i) => {
  const hole = {
    holeNumber: i + 1,
    par,
    yardage,
    strokes,
    putts,
    penalties,
    greenInRegulation,
    handicapIndex: i + 1,
  };
  if (fairwayHit !== null) hole.fairwayHit = fairwayHit; // FIR n/a on par 3
  return hole;
});

const grossScore = holes.reduce((s, h) => s + h.strokes, 0);
const totalPar = holes.reduce((s, h) => s + h.par, 0);
const totalPutts = holes.reduce((s, h) => s + h.putts, 0);
const par45 = holes.filter((h) => h.par !== 3);
const fairwaysHit = par45.filter((h) => h.fairwayHit).length;
const gir = holes.filter((h) => h.greenInRegulation).length;

const doc = {
  userId: UID,
  course: COURSE,
  date: DATE,
  startTime: `${DATE}T15:30:00.000Z`,
  endTime: `${DATE}T19:42:00.000Z`,
  roundType: '18',
  tee: { id: 'blue', name: 'Blue', color: '#2563eb' },
  ghinStatus: { eligible: true, posted: false },
  sourceService: 'demo-seed',
  isDemo: true,
  holes,
  stats: {
    grossScore,
    toPar: grossScore - totalPar,
    totalPutts,
    fairwaysHit,
    fairwaysTotal: par45.length,
    greensInRegulation: gir,
    greensTotal: holes.length,
    penalties: holes.reduce((s, h) => s + h.penalties, 0),
  },
  createdAt: Timestamp.fromDate(new Date(`${DATE}T19:45:00.000Z`)),
  updatedAt: Timestamp.now(),
};

await db.collection('scores').doc(DOC_ID).set(doc);

console.log(`Wrote scores/${DOC_ID} for ${UID}`);
console.log(`  ${COURSE.name} · ${DATE} · gross ${grossScore} (+${grossScore - totalPar} vs par ${totalPar})`);
console.log(`  ${holes.length} holes · ${totalPutts} putts · FIR ${fairwaysHit}/${par45.length} · GIR ${gir}/${holes.length}`);

// verify it reads back the way listUserRounds expects
const back = await db.collection('scores').doc(DOC_ID).get();
const v = back.data();
console.log(`\nVerify: exists=${back.exists}, userId match=${v.userId === UID}, holes=${v.holes.length}, grossScore=${v.stats.grossScore}`);
