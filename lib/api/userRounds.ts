import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  bearingBetween,
  destinationPoint,
  distanceYards,
  type LatLng,
  type ResolvedHole,
  type RoundShot,
  type Lie,
  type DispersionShot,
  type HoleLanding,
} from '@/lib/demo/kingRound';

export interface RoundListItem {
  id: string;
  courseName: string;
  courseId?: string;
  date: string;        // YYYY-MM-DD
  grossScore: number;
  par: number;
  scoreVsPar: number;
}

interface RawScoreHole {
  holeNumber: number;
  par: number;
  strokes?: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  penalties?: number;
  yardage?: number;
}

interface RawScoreDoc {
  userId: string;
  date: string;
  course: { id?: string; name: string };
  stats?: { grossScore?: number };
  holes?: RawScoreHole[];
}

// Shape of a doc in the web-native `rounds` collection (see lib/api/types.ts `Round`).
// Holes use `score` instead of `strokes`, and the course is flattened onto the doc.
interface RawRoundDoc {
  userId: string;
  date: string;
  courseId?: string;
  courseName?: string;
  score?: number;
  holes?: Array<{
    holeNumber: number;
    par: number;
    score?: number;
    putts?: number;
    fairwayHit?: boolean;
    greenInRegulation?: boolean;
    yardage?: number;
  }>;
}

// Normalize a `rounds` doc into the same RawScoreDoc shape the loader pipeline expects.
function roundDocToRawScore(r: RawRoundDoc): RawScoreDoc {
  return {
    userId: r.userId,
    date: r.date,
    course: { id: r.courseId, name: r.courseName ?? '(unknown course)' },
    stats: { grossScore: r.score },
    holes: (r.holes ?? []).map(h => ({
      holeNumber: h.holeNumber,
      par: h.par,
      strokes: h.score,
      putts: h.putts,
      fairwayHit: h.fairwayHit,
      greenInRegulation: h.greenInRegulation,
      yardage: h.yardage,
    })),
  };
}

// ----- list -----

export async function listUserRounds(userId: string, max = 50): Promise<RoundListItem[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'scores'),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  const out: RoundListItem[] = [];
  for (const d of snap.docs) {
    const v = d.data() as RawScoreDoc;
    const holes = v.holes ?? [];
    const par = holes.reduce((s, h) => s + (h.par ?? 0), 0);
    const score = v.stats?.grossScore ?? holes.reduce((s, h) => s + (h.strokes ?? 0), 0);
    out.push({
      id: d.id,
      courseName: v.course?.name ?? '(unknown course)',
      courseId: v.course?.id,
      date: v.date,
      grossScore: score,
      par,
      scoreVsPar: score - par,
    });
  }
  return out;
}

// ----- detail loader (round → ResolvedHole[] + dispersion shots) -----

export interface LoadedRound {
  meta: {
    id: string;
    courseName: string;
    date: string;
    totalScore: number;
    totalPar: number;
    hasFullGeometry: boolean; // false when the course's gpsData is missing
    /** 'calls' = reconstructed from optimizer calls only (no scorecard). */
    mode?: 'scorecard' | 'calls';
    /** In 'calls' mode: how many optimizer calls were captured. */
    callCount?: number;
  };
  holes: ResolvedHole[];
  dispersionShots: DispersionShot[];
  /**
   * In 'calls' mode, the REAL landing positions (where each optimizer call was
   * made), so the page plots actual data instead of synthesizing a shot chain.
   */
  landingsByHole?: Record<number, HoleLanding[]>;
}

export async function loadRound(scoreId: string): Promise<LoadedRound | null> {
  if (!db) return null;

  // Look in `scores` (mobile) first, then fall back to `rounds` (web-native).
  // The analytics list merges both collections, so an id from there can live in
  // either one — mirrors roundsApi.getRoundById in lib/api/rounds.ts.
  let score: RawScoreDoc | null = null;
  const scoreSnap = await getDoc(doc(db, 'scores', scoreId));
  if (scoreSnap.exists()) {
    const raw = scoreSnap.data() as RawScoreDoc & { analysisMode?: string; callsRoundId?: string };
    // Calls round: reconstruct from real optimizer-call shotEvents, not a
    // synthesized scorecard. Only the recommendations are real data.
    if (raw.analysisMode === 'calls') {
      return buildCallsRound(scoreId, raw);
    }
    score = raw;
  } else {
    const roundSnap = await getDoc(doc(db, 'rounds', scoreId));
    if (roundSnap.exists()) {
      score = roundDocToRawScore(roundSnap.data() as RawRoundDoc);
    }
  }
  if (!score) return null;
  const scoreHoles = (score.holes ?? []).slice().sort((a, b) => a.holeNumber - b.holeNumber);

  // Look up course geometry (per-hole tee + green coords) from /courses/{courseId}
  // Firestore stores coords as { latitude, longitude }; we convert to our { lat, lng } LatLng below.
  interface RawCoord { latitude: number; longitude: number }
  const courseGeometry: Record<number, { tee?: RawCoord; green?: RawCoord; distance?: number }> = {};
  if (score.course?.id) {
    try {
      const courseSnap = await getDoc(doc(db, 'courses', score.course.id));
      if (courseSnap.exists()) {
        const courseData = courseSnap.data() as { holes?: Array<{ number?: number; distance?: number; gpsData?: { teeBox?: RawCoord; greenCenter?: RawCoord } }> };
        for (const h of courseData.holes ?? []) {
          const n = h.number;
          if (!n) continue;
          courseGeometry[n] = {
            tee: h.gpsData?.teeBox,
            green: h.gpsData?.greenCenter,
            distance: h.distance,
          };
        }
      }
    } catch (err) {
      console.warn('[loadRound] course geometry lookup failed:', err);
    }
  }

  // Build per-hole ResolvedHoles + landings
  const holes: ResolvedHole[] = [];
  const dispersionShots: DispersionShot[] = [];
  let totalScore = 0;
  let totalPar = 0;
  let hasFullGeometry = true;

  for (const sh of scoreHoles) {
    totalScore += sh.strokes ?? 0;
    totalPar += sh.par ?? 0;
    const geom = courseGeometry[sh.holeNumber];
    if (!geom?.tee || !geom?.green) {
      hasFullGeometry = false;
      // Fabricate a placeholder geometry so the rest of the UI still renders.
      // Tee at (0,0), green N yards north — purely visual fallback.
      const fakeTee: LatLng = { lat: 0, lng: 0 };
      const lenYds = geom?.distance ?? sh.yardage ?? defaultLength(sh.par);
      const fakeGreen = destinationPoint(fakeTee, 0, lenYds);
      const shots = synthesizeShots(sh, lenYds, /*hasGeometry=*/ false);
      const resolved = buildResolvedHole(sh.holeNumber, sh.par, fakeTee, fakeGreen, lenYds, shots);
      holes.push(resolved);
      const landings = buildLandingsForChain(resolved);
      for (let i = 0; i < landings.length; i++) {
        const pos = dispersionFor(resolved, landings[i].land);
        dispersionShots.push({
          holeNumber: resolved.holeNumber,
          shotNumber: i + 1,
          label: `${resolved.holeNumber}/${i + 1}`,
          lie: landings[i].lie,
          distFromPin: pos.distFromPin,
          lateral: pos.lateral,
        });
      }
      continue;
    }
    const tee: LatLng = { lat: geom.tee.latitude, lng: geom.tee.longitude };
    const green: LatLng = { lat: geom.green.latitude, lng: geom.green.longitude };
    const lenYds = geom.distance ?? sh.yardage ?? defaultLength(sh.par);
    const shots = synthesizeShots(sh, lenYds, /*hasGeometry=*/ true);
    const resolved = buildResolvedHole(sh.holeNumber, sh.par, tee, green, lenYds, shots);
    holes.push(resolved);
    const landings = buildLandingsForChain(resolved);
    for (let i = 0; i < landings.length; i++) {
      const pos = dispersionFor(resolved, landings[i].land);
      dispersionShots.push({
        holeNumber: resolved.holeNumber,
        shotNumber: i + 1,
        label: `${resolved.holeNumber}/${i + 1}`,
        lie: landings[i].lie,
        distFromPin: pos.distFromPin,
        lateral: pos.lateral,
      });
    }
  }

  return {
    meta: {
      id: scoreId,
      courseName: score.course?.name ?? '(unknown course)',
      date: score.date,
      totalScore,
      totalPar,
      hasFullGeometry,
    },
    holes,
    dispersionShots,
  };
}

// ----- calls round (reconstruct from optimizer-call shotEvents) -----

interface RawCallEvent {
  eventType?: string;
  holeNumber?: number;
  timestamp?: number;
  gpsPosition?: { latitude: number; longitude: number } | null;
  payload?: { primaryClub?: string; primaryCarryYards?: number; targetType?: string };
}

// Builds a LoadedRound from the round's optimizer calls. Each call becomes one
// marker at its real GPS position, labelled with the club we recommended. We do
// NOT synthesize a shot chain — only the calls we actually captured are shown.
async function buildCallsRound(
  scoreId: string,
  meta: RawScoreDoc & { callsRoundId?: string },
): Promise<LoadedRound | null> {
  if (!db) return null;
  const courseId = meta.course?.id;
  const callsRoundId = meta.callsRoundId;
  if (!courseId || !callsRoundId) return null;

  // Course geometry (par, tee, green, distance per hole).
  interface RawCoord { latitude: number; longitude: number }
  const geom: Record<number, { par?: number; tee?: LatLng; green?: LatLng; dist?: number }> = {};
  const courseSnap = await getDoc(doc(db, 'courses', courseId));
  if (courseSnap.exists()) {
    const cd = courseSnap.data() as {
      holes?: Array<{ number?: number; par?: number; distance?: number; gpsData?: { teeBox?: RawCoord; greenCenter?: RawCoord } }>;
    };
    for (const h of cd.holes ?? []) {
      if (!h.number) continue;
      geom[h.number] = {
        par: h.par,
        dist: h.distance,
        tee: h.gpsData?.teeBox ? { lat: h.gpsData.teeBox.latitude, lng: h.gpsData.teeBox.longitude } : undefined,
        green: h.gpsData?.greenCenter ? { lat: h.gpsData.greenCenter.latitude, lng: h.gpsData.greenCenter.longitude } : undefined,
      };
    }
  }

  // The real optimizer calls for this round.
  const snap = await getDocs(
    query(
      collection(db, 'shotEvents'),
      where('userId', '==', meta.userId),
      where('roundId', '==', callsRoundId),
    )
  );
  const callsByHole = new Map<number, RawCallEvent[]>();
  let callCount = 0;
  for (const d of snap.docs) {
    const v = d.data() as RawCallEvent;
    if (v.eventType !== 'optimizer_run' || !v.gpsPosition || v.holeNumber == null) continue;
    callCount++;
    if (!callsByHole.has(v.holeNumber)) callsByHole.set(v.holeNumber, []);
    callsByHole.get(v.holeNumber)!.push(v);
  }

  const holes: ResolvedHole[] = [];
  const landingsByHole: Record<number, HoleLanding[]> = {};
  const dispersionShots: DispersionShot[] = [];

  for (const holeNum of [...callsByHole.keys()].sort((a, b) => a - b)) {
    const g = geom[holeNum];
    if (!g?.tee || !g?.green) continue; // need geometry to place on a map
    const calls = callsByHole.get(holeNum)!.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    const bearing = bearingBetween(g.tee, g.green);
    const lengthYds = g.dist ?? distanceYards(g.tee, g.green);

    const shots: RoundShot[] = calls.map(c => ({
      club: c.payload?.primaryClub ?? 'Optimizer',
      planned: c.payload?.primaryCarryYards ?? 200,
      shortPct: 1,
      offsetDeg: 0,
      lie: 'fairway' as Lie,
    }));
    const resolved: ResolvedHole = {
      holeNumber: holeNum,
      par: g.par ?? 4,
      tee: g.tee,
      green: g.green,
      bearing,
      lengthYds,
      shots,
      score: 0,
      putts: 0,
    };
    holes.push(resolved);

    // Place each marker at the recommended AIM point — the carry distance down
    // the tee→pin line (clamped to the hole length). This is the recommendation
    // itself (club + carry), shown where the optimizer told the player to aim,
    // so it's clearly visible on the map rather than buried on the tee.
    const landings: HoleLanding[] = calls.map(c => {
      const carry = c.payload?.primaryCarryYards ?? Math.round(lengthYds * 0.6);
      const aim = destinationPoint(g.tee!, bearing, Math.min(carry, lengthYds));
      return { land: aim, lie: 'fairway' as Lie };
    });
    landingsByHole[holeNum] = landings;
    landings.forEach((l, i) => {
      const pos = dispersionFor(resolved, l.land);
      dispersionShots.push({
        holeNumber: holeNum,
        shotNumber: i + 1,
        label: `${holeNum}/${i + 1}`,
        lie: l.lie,
        distFromPin: pos.distFromPin,
        lateral: pos.lateral,
      });
    });
  }

  return {
    meta: {
      id: scoreId,
      courseName: meta.course?.name ?? '(unknown course)',
      date: meta.date,
      totalScore: callCount,
      totalPar: 0,
      hasFullGeometry: true,
      mode: 'calls',
      callCount,
    },
    holes,
    dispersionShots,
    landingsByHole,
  };
}

// ----- helpers -----

function defaultLength(par: number): number {
  if (par === 3) return 165;
  if (par === 4) return 380;
  return 510;
}

function buildResolvedHole(
  holeNumber: number,
  par: number,
  tee: LatLng,
  green: LatLng,
  lengthYds: number,
  shots: RoundShot[]
): ResolvedHole {
  return {
    holeNumber,
    par,
    tee,
    green,
    bearing: bearingBetween(tee, green),
    lengthYds,
    shots,
    score: shots.length + 2, // approximate: non-putt shots + 2 putts (caller-supplied)
    putts: 2,
  };
}

interface ChainLanding { land: LatLng; lie: Lie }
function buildLandingsForChain(hole: ResolvedHole): ChainLanding[] {
  const out: ChainLanding[] = [];
  let origin: LatLng = { ...hole.tee };
  for (let i = 0; i < hole.shots.length; i++) {
    const s = hole.shots[i];
    const isLast = i === hole.shots.length - 1;
    const land: LatLng = isLast
      ? { lat: hole.green.lat, lng: hole.green.lng }
      : destinationPoint(origin, hole.bearing + s.offsetDeg, s.planned * s.shortPct);
    out.push({ land, lie: s.lie });
    origin = land;
  }
  return out;
}

function dispersionFor(hole: ResolvedHole, land: LatLng): { distFromPin: number; lateral: number } {
  const b = bearingBetween(hole.tee, land);
  const d = distanceYards(hole.tee, land);
  const angleDeg = b - hole.bearing;
  const a = ((((angleDeg + 540) % 360) - 180) * Math.PI) / 180;
  const fwd = d * Math.cos(a);
  const lat = d * Math.sin(a);
  return { distFromPin: hole.lengthYds - fwd, lateral: lat };
}

// Build a plausible shot chain matching the scorecard (par, strokes, putts,
// FIR, GIR). Each non-putt shot gets a club + planned yardage + lie. The
// final shot always lands on the green (chain logic snaps it there).
function synthesizeShots(
  sh: RawScoreHole,
  lengthYds: number,
  hasGeometry: boolean
): RoundShot[] {
  const strokes = Math.max(1, sh.strokes ?? sh.par);
  const putts = Math.max(0, sh.putts ?? 2);
  const nonPutt = Math.max(1, strokes - putts);
  const fir = sh.fairwayHit;
  const gir = sh.greenInRegulation;
  const inTrouble = (sh.penalties ?? 0) > 0;

  const shots: RoundShot[] = [];
  // First shot — tee shot
  if (sh.par === 3) {
    // Par 3: tee straight at green; aiming for lengthYds, sometimes miss
    const planned = lengthYds;
    const shortPct = gir ? 0.97 : 0.92;
    const offsetDeg = gir ? 1 : (inTrouble ? -7 : 4);
    const lie: Lie = gir ? 'green' : (inTrouble ? 'water' : 'rough');
    shots.push({ club: clubForDistance(planned), planned, shortPct, offsetDeg, lie });
  } else {
    // Par 4/5: driver tee shot
    const planned = sh.par === 4 ? 240 : 245;
    const shortPct = fir ? 0.94 : 0.88;
    const offsetDeg = fir ? 2 : (inTrouble ? 9 : 6);
    const lie: Lie = fir ? 'fairway' : (inTrouble ? 'water' : 'rough');
    shots.push({ club: 'Driver', planned, shortPct, offsetDeg, lie });
  }

  // Middle shots (recovery / approach iterations) — anything between first
  // and last, distributed evenly across the remaining yardage.
  const remaining = nonPutt - 2; // exclude tee shot + final approach
  if (remaining > 0) {
    // Approximate yards left after the tee shot
    const teeCovered = shots[0].planned * shots[0].shortPct;
    let remainingYds = Math.max(50, lengthYds - teeCovered);
    for (let i = 0; i < remaining; i++) {
      const slice = remainingYds / (remaining - i + 1);
      const planned = Math.max(40, Math.min(200, slice * 1.05));
      const shortPct = 0.92 + (Math.random() - 0.5) * 0.08;
      const offsetDeg = (i % 2 === 0 ? -3 : 3) + (Math.random() - 0.5) * 4;
      const lie: Lie =
        i === 0 && inTrouble ? 'sand' :
        i % 2 === 0 ? 'fairway' : 'rough';
      shots.push({ club: clubForDistance(planned), planned, shortPct, offsetDeg, lie });
      remainingYds -= planned * shortPct;
    }
  }

  // Final approach — pin if score - putts ≥ 2; otherwise it's the only shot.
  if (nonPutt >= 2) {
    // Approximate "remaining to green" for the final approach
    const covered = shots.reduce((s, sh) => s + sh.planned * sh.shortPct, 0);
    const remainingToPin = Math.max(8, lengthYds - covered);
    const planned = Math.max(8, Math.min(150, remainingToPin * 1.03));
    const offsetDeg = gir ? 1 : -2;
    shots.push({
      club: clubForDistance(planned),
      planned,
      shortPct: 1.0, // last shot snaps to green via chain logic regardless
      offsetDeg,
      lie: 'green',
    });
  }

  void hasGeometry; // reserved; could vary visuals when no real map shown
  return shots;
}

function clubForDistance(yds: number): string {
  if (yds < 25) return 'LW';
  if (yds < 60) return 'SW';
  if (yds < 100) return 'PW';
  if (yds < 130) return '9-iron';
  if (yds < 150) return '8-iron';
  if (yds < 165) return '7-iron';
  if (yds < 180) return '6-iron';
  if (yds < 195) return '5-iron';
  if (yds < 215) return '4-iron';
  if (yds < 235) return '3-wood';
  return 'Driver';
}
