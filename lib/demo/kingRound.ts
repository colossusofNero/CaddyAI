// Demo round data — The King — Starfire Golf Club.
// Real per-hole tee + green coords from /courses/oYEPmjf4lKJK.
// Round plan is a realistic 95 (par 70, +25). Each shot carries a planned
// distance, a shortPct (% actually carried), an offset in degrees off the
// tee→pin line, and a lie label for the landing.
//
// Used by:
//   - app/(app)/analytics/round-summary/page.tsx
//   - public/shot-chain-demo.html  (inlined copy)
//   - public/shot-dispersion.html  (inlined copy)
//   - public/round-summary.html    (inlined copy)

export interface LatLng { lat: number; lng: number }

export interface RawHole {
  par: number;
  dist: number;
  tee: LatLng;
  green: LatLng;
}

export type Lie =
  | 'fairway' | 'rough' | 'deep-rough' | 'sand' | 'water' | 'fringe' | 'green' | '';

export interface RoundShot {
  club: string;
  planned: number;
  shortPct: number;
  offsetDeg: number;
  lie: Lie;
}

export interface RoundHole {
  score: number;
  putts: number;
  shots: RoundShot[];
}

export const HOLES_RAW: RawHole[] = [
  { par: 5, dist: 559, tee: { lat: 33.58947, lng: -111.90802 }, green: { lat: 33.59391, lng: -111.90807 } },
  { par: 3, dist: 188, tee: { lat: 33.59466, lng: -111.90813 }, green: { lat: 33.59611, lng: -111.90791 } },
  { par: 4, dist: 421, tee: { lat: 33.59564, lng: -111.90647 }, green: { lat: 33.59223, lng: -111.90614 } },
  { par: 3, dist: 144, tee: { lat: 33.59212, lng: -111.90464 }, green: { lat: 33.59304, lng: -111.90380 } },
  { par: 4, dist: 349, tee: { lat: 33.59471, lng: -111.90123 }, green: { lat: 33.59473, lng: -111.90459 } },
  { par: 5, dist: 498, tee: { lat: 33.59625, lng: -111.90534 }, green: { lat: 33.59603, lng: -111.90052 } },
  { par: 4, dist: 400, tee: { lat: 33.59530, lng: -111.90034 }, green: { lat: 33.59205, lng: -111.90055 } },
  { par: 3, dist: 203, tee: { lat: 33.59239, lng: -111.90246 }, green: { lat: 33.59096, lng: -111.90340 } },
  { par: 5, dist: 504, tee: { lat: 33.58956, lng: -111.90221 }, green: { lat: 33.58981, lng: -111.90714 } },
  { par: 3, dist: 197, tee: { lat: 33.58822, lng: -111.90956 }, green: { lat: 33.58710, lng: -111.91084 } },
  { par: 4, dist: 396, tee: { lat: 33.58667, lng: -111.91180 }, green: { lat: 33.58370, lng: -111.91226 } },
  { par: 4, dist: 339, tee: { lat: 33.58380, lng: -111.91310 }, green: { lat: 33.58633, lng: -111.91396 } },
  { par: 5, dist: 479, tee: { lat: 33.58724, lng: -111.91545 }, green: { lat: 33.58337, lng: -111.91502 } },
  { par: 3, dist: 169, tee: { lat: 33.58302, lng: -111.91539 }, green: { lat: 33.58333, lng: -111.91385 } },
  { par: 4, dist: 385, tee: { lat: 33.58298, lng: -111.91296 }, green: { lat: 33.58261, lng: -111.90940 } },
  { par: 4, dist: 369, tee: { lat: 33.58246, lng: -111.90905 }, green: { lat: 33.58478, lng: -111.91069 } },
  { par: 3, dist: 153, tee: { lat: 33.58512, lng: -111.91088 }, green: { lat: 33.58510, lng: -111.90945 } },
  { par: 4, dist: 353, tee: { lat: 33.58538, lng: -111.90920 }, green: { lat: 33.58824, lng: -111.90921 } },
];

export const ROUND_PLAN: RoundHole[] = [
  { score: 7, putts: 2, shots: [
    { club: 'Driver', planned: 245, shortPct: 0.85, offsetDeg:  8, lie: 'rough' },
    { club: '7-iron', planned: 150, shortPct: 0.97, offsetDeg: -2, lie: 'fairway' },
    { club: '5-iron', planned: 180, shortPct: 0.91, offsetDeg:  3, lie: 'fairway' },
    { club: 'PW',     planned:  65, shortPct: 0.88, offsetDeg: -1, lie: 'fringe' },
    { club: 'LW',     planned:  10, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 4, putts: 2, shots: [
    { club: '5-iron', planned: 195, shortPct: 0.90, offsetDeg: -5, lie: 'rough' },
    { club: 'SW',     planned:  20, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 5, putts: 2, shots: [
    { club: 'Driver', planned: 250, shortPct: 0.94, offsetDeg:  3, lie: 'fairway' },
    { club: '6-iron', planned: 175, shortPct: 0.94, offsetDeg: -2, lie: 'sand' },
    { club: 'SW',     planned:  25, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 3, putts: 2, shots: [
    { club: '8-iron', planned: 150, shortPct: 0.97, offsetDeg:  1, lie: 'green' },
  ]},
  { score: 5, putts: 2, shots: [
    { club: 'Driver', planned: 240, shortPct: 0.90, offsetDeg: -4, lie: 'fairway' },
    { club: '7-iron', planned: 145, shortPct: 0.90, offsetDeg:  2, lie: 'fringe' },
    { club: 'PW',     planned:   8, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 7, putts: 2, shots: [
    { club: 'Driver', planned: 245, shortPct: 0.90, offsetDeg: -7, lie: 'rough' },
    { club: '5-iron', planned: 180, shortPct: 0.92, offsetDeg:  4, lie: 'rough' },
    { club: '6-iron', planned: 165, shortPct: 0.88, offsetDeg: -3, lie: 'fairway' },
    { club: 'PW',     planned:  75, shortPct: 0.85, offsetDeg:  2, lie: 'fringe' },
    { club: 'LW',     planned:   8, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 5, putts: 2, shots: [
    { club: 'Driver', planned: 250, shortPct: 0.88, offsetDeg:  6, lie: 'rough' },
    { club: '6-iron', planned: 180, shortPct: 0.92, offsetDeg: -2, lie: 'fringe' },
    { club: 'PW',     planned:  15, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 5, putts: 2, shots: [
    { club: '4-iron', planned: 205, shortPct: 0.95, offsetDeg: -8, lie: 'water' },
    { club: '5-iron', planned: 190, shortPct: 0.92, offsetDeg:  3, lie: 'sand' },
    { club: 'SW',     planned:  20, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 6, putts: 2, shots: [
    { club: 'Driver', planned: 250, shortPct: 0.94, offsetDeg:  2, lie: 'fairway' },
    { club: '5-wood', planned: 210, shortPct: 0.93, offsetDeg: -3, lie: 'rough' },
    { club: '9-iron', planned:  85, shortPct: 0.88, offsetDeg:  1, lie: 'fringe' },
    { club: 'LW',     planned:  10, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 4, putts: 2, shots: [
    { club: '4-iron', planned: 200, shortPct: 0.92, offsetDeg:  4, lie: 'rough' },
    { club: 'PW',     planned:  20, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 5, putts: 2, shots: [
    { club: 'Driver', planned: 250, shortPct: 0.92, offsetDeg: -3, lie: 'fairway' },
    { club: '7-iron', planned: 170, shortPct: 0.91, offsetDeg:  4, lie: 'sand' },
    { club: 'SW',     planned:  18, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 6, putts: 2, shots: [
    { club: 'Driver', planned: 240, shortPct: 0.80, offsetDeg:  9, lie: 'rough' },
    { club: '8-iron', planned: 145, shortPct: 0.90, offsetDeg: -4, lie: 'fairway' },
    { club: 'PW',     planned: 100, shortPct: 0.90, offsetDeg:  2, lie: 'rough' },
    { club: 'SW',     planned:  25, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 7, putts: 2, shots: [
    { club: 'Driver', planned: 245, shortPct: 0.88, offsetDeg: -6, lie: 'rough' },
    { club: '5-iron', planned: 185, shortPct: 0.92, offsetDeg:  3, lie: 'water' },
    { club: '6-iron', planned: 165, shortPct: 0.91, offsetDeg: -2, lie: 'fairway' },
    { club: '9-iron', planned: 115, shortPct: 0.96, offsetDeg:  1, lie: 'fringe' },
    { club: 'LW',     planned:  10, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 4, putts: 2, shots: [
    { club: '6-iron', planned: 175, shortPct: 0.89, offsetDeg:  5, lie: 'rough' },
    { club: 'PW',     planned:  20, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 5, putts: 2, shots: [
    { club: 'Driver', planned: 250, shortPct: 0.92, offsetDeg:  2, lie: 'fairway' },
    { club: '8-iron', planned: 160, shortPct: 0.88, offsetDeg: -3, lie: 'fringe' },
    { club: 'PW',     planned:  18, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 6, putts: 3, shots: [
    { club: 'Driver', planned: 245, shortPct: 0.92, offsetDeg: -2, lie: 'fairway' },
    { club: '7-iron', planned: 160, shortPct: 0.85, offsetDeg:  3, lie: 'fringe' },
    { club: 'PW',     planned:  25, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 4, putts: 2, shots: [
    { club: '8-iron', planned: 155, shortPct: 0.92, offsetDeg: -4, lie: 'rough' },
    { club: 'PW',     planned:  18, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
  { score: 7, putts: 3, shots: [
    { club: 'Driver', planned: 250, shortPct: 0.78, offsetDeg: 10, lie: 'rough' },
    { club: '7-iron', planned: 145, shortPct: 0.92, offsetDeg: -3, lie: 'fairway' },
    { club: '9-iron', planned: 125, shortPct: 0.90, offsetDeg:  2, lie: 'sand' },
    { club: 'SW',     planned:  30, shortPct: 1.00, offsetDeg:  0, lie: 'green' },
  ]},
];

// ----- geo helpers -----
const EARTH_RADIUS_M = 6371000;
const M_PER_YARD = 0.9144;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function destinationPoint(origin: LatLng, bearingDeg: number, distanceYards: number): LatLng {
  const distM = distanceYards * M_PER_YARD;
  const ang = distM / EARTH_RADIUS_M;
  const brg = toRad(bearingDeg);
  const lat1 = toRad(origin.lat);
  const lng1 = toRad(origin.lng);
  const sinLat2 = Math.sin(lat1) * Math.cos(ang) + Math.cos(lat1) * Math.sin(ang) * Math.cos(brg);
  const lat2 = Math.asin(sinLat2);
  const y = Math.sin(brg) * Math.sin(ang) * Math.cos(lat1);
  const x = Math.cos(ang) - Math.sin(lat1) * sinLat2;
  const lng2 = lng1 + Math.atan2(y, x);
  return { lat: toDeg(lat2), lng: (((toDeg(lng2)) + 540) % 360) - 180 };
}

export function bearingBetween(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function distanceYards(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return (2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))) / M_PER_YARD;
}

// ----- composed round (HOLES with bearing + shots wired in) -----
export interface ResolvedHole {
  holeNumber: number;
  par: number;
  tee: LatLng;
  green: LatLng;
  bearing: number;
  lengthYds: number;
  shots: RoundShot[];
  score: number;
  putts: number;
}

export const HOLES: ResolvedHole[] = HOLES_RAW.map((h, i) => ({
  holeNumber: i + 1,
  par: h.par,
  tee: h.tee,
  green: h.green,
  bearing: bearingBetween(h.tee, h.green),
  lengthYds: h.dist,
  shots: ROUND_PLAN[i].shots,
  score: ROUND_PLAN[i].score,
  putts: ROUND_PLAN[i].putts,
}));

export interface HoleLanding { land: LatLng; lie: Lie }
export function buildHoleLandings(hole: ResolvedHole): HoleLanding[] {
  const out: HoleLanding[] = [];
  let origin: LatLng = { ...hole.tee };
  for (let i = 0; i < hole.shots.length; i++) {
    const s = hole.shots[i];
    const isLast = i === hole.shots.length - 1;
    const land = isLast
      ? { lat: hole.green.lat, lng: hole.green.lng }
      : destinationPoint(origin, hole.bearing + s.offsetDeg, s.planned * s.shortPct);
    out.push({ land, lie: s.lie });
    origin = land;
  }
  return out;
}

export interface DispersionShot {
  holeNumber: number;
  shotNumber: number;
  label: string;
  lie: Lie;
  distFromPin: number; // yards short of pin (positive)
  lateral: number;     // yards right of tee→pin line (positive)
}

export function allDispersionShots(): DispersionShot[] {
  const out: DispersionShot[] = [];
  for (const hole of HOLES) {
    const landings = buildHoleLandings(hole);
    landings.forEach((l, idx) => {
      const teeToLandBearing = bearingBetween(hole.tee, l.land);
      const teeToLandDist = distanceYards(hole.tee, l.land);
      const angleDeg = teeToLandBearing - hole.bearing;
      const a = ((((angleDeg + 540) % 360) - 180) * Math.PI) / 180;
      const fwdFromTee = teeToLandDist * Math.cos(a);
      const lat = teeToLandDist * Math.sin(a);
      out.push({
        holeNumber: hole.holeNumber,
        shotNumber: idx + 1,
        label: `${hole.holeNumber}/${idx + 1}`,
        lie: l.lie,
        distFromPin: hole.lengthYds - fwdFromTee,
        lateral: lat,
      });
    });
  }
  return out;
}

export const LIE_COLORS: Record<string, string> = {
  fairway: '#22c55e',
  rough: '#ca8a04',
  'deep-rough': '#78350f',
  sand: '#eab308',
  water: '#3b82f6',
  fringe: '#86efac',
  green: '#15803d',
  '': '#777',
};

export const COURSE_INFO = {
  courseId: 'oYEPmjf4lKJK',
  name: 'The King — Starfire Golf Club',
  city: 'Scottsdale',
  state: 'AZ',
};

export const PGA_PROS = [
  { name: 'Mike Larson (PGA)',    email: 'mike.larson@example-pga.com',    facility: 'Starfire Golf Academy, Scottsdale' },
  { name: 'Janelle Carter (PGA)', email: 'janelle.carter@example-pga.com', facility: 'Phoenix Country Club' },
  { name: 'Tom Reilly (PGA)',     email: 'tom.reilly@example-pga.com',     facility: 'Camelback Golf Club' },
  { name: 'Sara Ng (LPGA Pro)',   email: 'sara.ng@example-pga.com',        facility: 'Grayhawk Learning Center' },
];
