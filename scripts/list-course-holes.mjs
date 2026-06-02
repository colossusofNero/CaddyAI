import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

const db = getFirestore();
const snap = await db.collection('courseHoles').get();

console.log(`Found ${snap.size} courseHoles docs:\n`);
const byCourse = {};
snap.forEach(d => {
  const v = d.data();
  const courseId = v.courseId ?? '(no courseId)';
  if (!byCourse[courseId]) byCourse[courseId] = [];
  byCourse[courseId].push({
    docId: d.id,
    hole: v.holeNumber,
    par: v.par,
    tee: v.teeBoxes?.[0]?.position ?? v.tee?.position ?? null,
    green: v.greenCenter ?? null,
    hasFairway: Array.isArray(v.fairwayPolygon) && v.fairwayPolygon.length > 0,
    hasGreenPoly: Array.isArray(v.greenPolygon) && v.greenPolygon.length > 0,
  });
});
for (const [courseId, holes] of Object.entries(byCourse)) {
  console.log(`Course: ${courseId} (${holes.length} hole(s))`);
  holes.sort((a, b) => (a.hole ?? 0) - (b.hole ?? 0));
  for (const h of holes) {
    const t = h.tee ? `${h.tee.latitude.toFixed(5)}, ${h.tee.longitude.toFixed(5)}` : '—';
    const g = h.green ? `${h.green.latitude.toFixed(5)}, ${h.green.longitude.toFixed(5)}` : '—';
    console.log(`  h${h.hole} (par ${h.par})  tee=${t}  green=${g}  fw=${h.hasFairway ? '✓' : '×'}  green-poly=${h.hasGreenPoly ? '✓' : '×'}`);
  }
}
process.exit(0);
