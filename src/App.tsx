/*
CaddyAI v2.3 — Hazard-Aware Layup Logic + Conversational Tee Geometry
--------------------------------------------------------------------
What's new in 2.3 (compared to v2.2):
- **Automatic layup suggestion**: when a directional hazard band (e.g., right bunker 250–265y) + narrow fairway makes the attack high-risk,
  the model adds explicit *pre-hazard layup* plans and lets the formula pick the best two. No manual toggle needed.
- **Driver-only fairway width penalty** kept (as requested).
- **Bug fixes**: cleaned stray characters, restored proper JSX closing tags.
- **Self-tests**: added a scenario expecting layup < driver when fairway narrows to 15y and a 250–265y right hazard exists.

Notes:
- `Math.erf` is still replaced with the Abramowitz–Stegun approximation (portable).
- Replace the toy strokes-to-hole model with your strokes-gained tables when available.
*/

import React, { useMemo, useState, useEffect, useRef } from "react";
import { ArrowRight, Flag, Wind, CheckCircle2, XCircle, Mic, MicOff, Volume2 } from "lucide-react";

// ---------- Math helpers (erf, normal CDF Φ) ----------

// Abramowitz & Stegun 7.1.26 approximation for error function
// Max error < 1.5e-7 in practice; sufficient for UI modeling
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429;
  const poly = (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t;
  const y = 1 - poly * Math.exp(-ax * ax);
  return sign * y;
}

function phiCDF(z: number): number {
  // Standard normal CDF using erf
  const val = 0.5 * (1 + erf(z / Math.SQRT2));
  // Clamp to [0,1] to avoid tiny numeric spillover
  return Math.max(0, Math.min(1, val));
}

function pBeyondThreshold(mean: number, sigma: number, threshold: number): number {
  // P(X > threshold) for Normal(mean, sigma)
  if (sigma <= 0) return mean > threshold ? 1 : 0;
  const z = (threshold - mean) / sigma;
  return 1 - phiCDF(z);
}

function pBand(mean: number, sigma: number, start: number, end: number): number {
  // P(start <= X < end) for Normal(mean, sigma)
  if (sigma <= 0) return (mean >= start && mean < end) ? 1 : 0;
  const zA = (start - mean) / sigma;
  const zB = (end - mean) / sigma;
  return Math.max(0, phiCDF(zB) - phiCDF(zA));
}

function pWithinFairway(sigLat: number, widthYds?: number | null): number {
  // P(|X| < width/2) for lateral normal with std sigLat
  if (!widthYds || widthYds <= 0) return 0;
  if (sigLat <= 0) return 1;
  const z = widthYds / (2 * sigLat);
  return 2 * phiCDF(z) - 1;
}

function pMissSide(sigLat: number, widthYds: number | null | undefined, side: "left" | "right", margin = 5): number {
  // One-sided miss probability beyond fairway edge + margin on the specified side
  const half = (widthYds && widthYds > 0 ? widthYds / 2 : 15) + margin; // default 15y half-width if unknown
  if (sigLat <= 0) return 0;
  const z = half / sigLat;
  const tail = 1 - phiCDF(z);
  return Math.max(0, Math.min(1, tail));
}

// ---------- Types ----------

type Hand = "R" | "L";
type Shape = "draw" | "fade" | "straight" | "any";
type Lie = "tee" | "fairway" | "light_rough" | "heavy_rough" | "sand" | "recovery";

type Stance = "flat" | "ball_above" | "ball_below" | "uphill" | "downhill";

type PinPos = "front" | "middle" | "back";

type ClubId =
  | "D" | "3W" | "5W" | "3H"
  | "4i" | "5i" | "6i" | "7i" | "8i" | "9i"
  | "PW" | "GW" | "SW" | "LW";

const CLUB_ORDER: ClubId[] = ["D","3W","5W","3H","4i","5i","6i","7i","8i","9i","PW","GW","SW","LW"];
function clubIndex(c: ClubId) { return CLUB_ORDER.indexOf(c); }

interface ClubSpec {
  carry: number;        // avg carry, yards
  total: number;        // avg total, yards (normal fairway)
  sigCarry: number;     // std dev carry, yards
  sigLat: number;       // std dev lateral, yards
  confidence: number;   // 0..1 (self-rated)
}

interface PPM {
  dominantHand: Hand;
  handicap: number;           // e.g., 12
  preferredShape: Exclude<Shape, "any">;
  trajectory: "low" | "mid" | "high";
  clubs: Record<ClubId, ClubSpec>;
}

interface Environment {
  windSpeed: number;      // mph
  windDir: "head" | "tail" | "cross_left" | "cross_right"; // relative to target line
  temperatureF: number;   // ambient temp
  referenceTempF: number; // baseline, usually 70F
  elevationFt: number;    // +uphill to target, negative is downhill
  altitudeFt: number;     // site altitude above sea level
  greenFirm: "soft" | "medium" | "firm";
}

interface Questionnaire {
  lie: Lie;
  stance: Stance;
  pinPos: PinPos;
  hazardRisk: 1 | 2 | 3 | 4 | 5;      // course-side danger level as you perceive it now
  requiredShape: Shape;                // if a shape is mandated by trees/wind/angle
  confidence: 1 | 2 | 3 | 4 | 5;      // moment-to-moment confidence
  // Tee-strategy conversational inputs
  fairwayWidthAtDriverYds?: number | null;     // fairway width around expected tee landing (driver), yards
  hazardSide?: "left" | "right" | null;       // side-specific hazard (e.g., right bunker)
  hazardStartYds?: number | null;              // e.g., 250 (start of bunker zone)
  hazardClearYds?: number | null;              // e.g., 265 (carry past this to be safe)
}

interface ShotInput {
  distanceToHole: number; // yards (front-middle-back uncertainty handled via pinPos + safety)
  ppm: PPM;
  env: Environment;
  q: Questionnaire;
}

interface CandidateEval {
  club: ClubId;
  targetCarry: number;        // chosen carry target to landing zone center
  intendedShape: Shape;
  aimLateralYds: number;      // + right, - left
  expStrokes: number;         // modeled E[strokes-to-hole]
  leaveYds: number;           // expected distance remaining after this shot
  leaveLie: Lie;              // expected lie after this shot
  reasons: string[];
}

// ---------- Sample Player Model (replace with user's PPM) ----------

const defaultPPM: PPM = {
  dominantHand: "R",
  handicap: 12,
  preferredShape: "draw",
  trajectory: "mid",
  clubs: {
    D:   { carry: 240, total: 260, sigCarry: 12, sigLat: 15, confidence: 0.8 },
    "3W":{ carry: 220, total: 235, sigCarry: 10, sigLat: 14, confidence: 0.8 },
    "5W":{ carry: 205, total: 220, sigCarry: 10, sigLat: 13, confidence: 0.8 },
    "3H":{ carry: 195, total: 205, sigCarry: 9,  sigLat: 12, confidence: 0.8 },
    "4i":{ carry: 185, total: 195, sigCarry: 9,  sigLat: 11, confidence: 0.8 },
    "5i":{ carry: 175, total: 185, sigCarry: 9,  sigLat: 11, confidence: 0.8 },
    "6i":{ carry: 165, total: 175, sigCarry: 8,  sigLat: 10, confidence: 0.85 },
    "7i":{ carry: 155, total: 165, sigCarry: 8,  sigLat: 9,  confidence: 0.85 },
    "8i":{ carry: 145, total: 155, sigCarry: 7,  sigLat: 8,  confidence: 0.9 },
    "9i":{ carry: 132, total: 142, sigCarry: 7,  sigLat: 8,  confidence: 0.9 },
    PW:  { carry: 120, total: 130, sigCarry: 6,  sigLat: 8,  confidence: 0.92 },
    GW:  { carry: 105, total: 112, sigCarry: 6,  sigLat: 8,  confidence: 0.92 },
    SW:  { carry: 90,  total: 95,  sigCarry: 7,  sigLat: 8,  confidence: 0.9 },
    LW:  { carry: 70,  total: 72,  sigCarry: 8,  sigLat: 9,  confidence: 0.85 },
  },
};

const defaultEnv: Environment = {
  windSpeed: 6,
  windDir: "head",
  temperatureF: 85,
  referenceTempF: 70,
  elevationFt: 0,
  altitudeFt: 1000,
  greenFirm: "medium",
};

const defaultQ: Questionnaire = {
  lie: "fairway",
  stance: "flat",
  pinPos: "middle",
  hazardRisk: 3,
  requiredShape: "any",
  confidence: 3,
  fairwayWidthAtDriverYds: null,
  hazardSide: null,
  hazardStartYds: null,
  hazardClearYds: null,
};

// ---------- Physics-ish adjustments (kept simple & explainable) ----------

function tempPercentDelta(env: Environment) {
  // +0.2% carry per +10°F above baseline, −0.2% per −10°F below
  const dt = env.temperatureF - env.referenceTempF;
  return 0.002 * (dt / 10);
}

function altitudePercentDelta(env: Environment) {
  // ~+2% per 1000 ft of altitude
  return 0.02 * (env.altitudeFt / 1000);
}

function elevationPercentDelta(env: Environment) {
  // About ±0.1% per foot relative elevation (100 ft drop ~ +10%)
  return -0.001 * env.elevationFt; // uphill positive reduces distance
}

function windYardDelta(env: Environment, nominalCarry: number) {
  // Rule-of-thumb: ~0.3 yd of effect per mph at ~200y. Scale linearly with distance.
  // Tail adds, head subtracts. Crosswind handled separately via dispersion.
  const factorAt200 = 0.3; // yd/mph
  const scale = nominalCarry / 200;
  if (env.windDir === "tail") return +factorAt200 * env.windSpeed * scale;
  if (env.windDir === "head") return -factorAt200 * env.windSpeed * scale;
  return 0;
}

// Crosswind dispersion boost with shot-shape neutralization
function crosswindSigmaBoost(env: Environment, shape: Shape, hand: Hand): number {
  // Sign convention: +1 = left→right wind (cross_left), -1 = right→left (cross_right)
  if (env.windDir !== "cross_left" && env.windDir !== "cross_right") return 0;
  const windSign = env.windDir === "cross_left" ? +1 : -1;

  // Shot shape direction depends on handedness
  // Right-hand: fade = L→R (+1), draw = R→L (-1)
  // Left-hand:  fade = R→L (-1), draw = L→R (+1)
  let shapeSign = 0;
  if (shape === "fade") shapeSign = hand === "R" ? +1 : -1;
  else if (shape === "draw") shapeSign = hand === "R" ? -1 : +1;
  else shapeSign = 0; // straight or any => no intentional counter-shape

  const BASE_SIGMA_PER_MPH = 0.5; // yards of lateral σ added per 1 mph crosswind (baseline)
  const NEUTRALIZE = 0.6;         // 60% reduction if shape counters the wind
  const AMPLIFY = 0.4;            // 40% increase if shape rides with the wind

  let boost = BASE_SIGMA_PER_MPH * env.windSpeed;
  const prod = windSign * shapeSign;
  if (prod === -1) boost *= (1 - NEUTRALIZE);   // counter-shape: fade vs R→L wind or draw vs L→R wind
  else if (prod === +1) boost *= (1 + AMPLIFY); // with-wind shape
  // If prod === 0 → no intentional shape, keep baseline boost

  return boost;
}

function lieCarryPenaltyPct(lie: Lie): number {
  // Updated per request: heavy rough ≈ -10%, light rough ≈ -5%
  switch (lie) {
    case "tee": return 0;
    case "fairway": return 0;
    case "light_rough": return 0.05;
    case "heavy_rough": return 0.10;
    case "sand": return 0.05;
    case "recovery": return 0.12;
    default: return 0;
  }
}

function lieRollMultiplier(lie: Lie, firm: Environment["greenFirm"]): number {
  // crude roll behavior: rough/sand reduce roll
  const firmBase = firm === "firm" ? 1.2 : firm === "soft" ? 0.8 : 1.0;
  const lieBase = lie === "fairway" || lie === "tee" ? 1 : lie === "light_rough" ? 0.8 : lie === "heavy_rough" ? 0.6 : lie === "sand" ? 0.5 : 0.4;
  return firmBase * lieBase;
}

function stanceDispersionBoost(stance: Stance): { lat: number; carry: number } {
  switch (stance) {
    case "flat": return { lat: 0, carry: 0 };
    case "ball_above": return { lat: 2, carry: 1 };
    case "ball_below": return { lat: 2, carry: 1 };
    case "uphill": return { lat: 1, carry: 2 };
    case "downhill": return { lat: 1, carry: 2 };
    default: return { lat: 0, carry: 0 };
  }
}

// ---------- Risk appetite model ----------

function riskLambda(handicap: number, confidence: number): number {
  // Higher lambda => more conservative (more penalty weight)
  // 0.8 to 1.5 typical range
  const base = 1.1 + (handicap - 5) * 0.01; // +0.01 per handicap above 5
  const confAdj = 1.0 + (3 - confidence) * 0.05; // if confidence < 3, more conservative
  return Math.min(1.5, Math.max(0.8, base * confAdj));
}

// ---------- Strokes-to-hole model (toy; replace with real SG table) ----------

function expectedStrokesToHole(distanceYds: number, lie: Lie): number {
  // coarse piecewise: fairway baseline; other lies add penalties
  const d = Math.max(0, distanceYds);
  let base: number;
  if (d > 220) base = 3.4 + (d - 220) * 0.002; // long approaches get harder
  else if (d > 160) base = 3.1 + (d - 160) * 0.002; // 160..220
  else if (d > 120) base = 2.8 + (d - 120) * 0.0025; // 120..160
  else if (d > 80) base = 2.5 + (d - 80) * 0.003; // 80..120
  else if (d > 40) base = 2.2 + (d - 40) * 0.004; // 40..80
  else if (d > 10) base = 1.8 + (d - 10) * 0.01; // 10..40
  else base = 1.5 + d * 0.02; // 0..10

  const liePenalty = lie === "fairway" || lie === "tee" ? 0
    : lie === "light_rough" ? 0.05
    : lie === "heavy_rough" ? 0.15
    : lie === "sand" ? 0.12
    : 0.25; // recovery

  return base + liePenalty;
}

// ---------- Core evaluation ----------

function adjustCarry(ppm: PPM, club: ClubId, env: Environment, lie: Lie): number {
  const spec = ppm.clubs[club];
  const pct = 1 + tempPercentDelta(env) + altitudePercentDelta(env) + elevationPercentDelta(env) - lieCarryPenaltyPct(lie);
  const windYds = windYardDelta(env, spec.carry);
  return spec.carry * pct + windYds;
}

function adjustTotal(ppm: PPM, club: ClubId, env: Environment, lie: Lie): number {
  const spec = ppm.clubs[club];
  const rollMult = lieRollMultiplier(lie, env.greenFirm);
  // scale total beyond carry by roll multiplier and same environment pct (except wind already in carry)
  const baseRoll = Math.max(0, spec.total - spec.carry);
  const pct = 1 + tempPercentDelta(env) + altitudePercentDelta(env) + elevationPercentDelta(env);
  return spec.carry * pct + windYardDelta(env, spec.carry) + baseRoll * rollMult;
}

function dispersion(ppm: PPM, club: ClubId, env: Environment, stance: Stance, shape: Shape, hand: Hand): { sigCarry: number; sigLat: number } {
  const base = ppm.clubs[club];
  const stanceBoost = stanceDispersionBoost(stance);
  const crossBoost = crosswindSigmaBoost(env, shape, hand);
  return {
    sigCarry: base.sigCarry + stanceBoost.carry,
    sigLat: base.sigLat + stanceBoost.lat + crossBoost,
  };
}

function safetyBufferYards(hazardRisk: number, pinPos: PinPos): number {
  // front pin -> add a touch more front safety; back pin -> add back safety
  const base = 3 + hazardRisk * 1.5; // 4.5..10.5 yards
  return base + (pinPos === "front" || pinPos === "back" ? 1.5 : 0);
}

function probabilityTailRiskBeyond(buffer: number, sigma: number): number {
  // P(|X| > buffer) for 1D normal ~ 2 * (1 - Φ(buffer/sigma))
  if (sigma <= 0) return 0;
  const z = buffer / sigma;
  const phi = phiCDF(z);
  const tail = Math.max(0, 1 - phi);
  return 2 * tail;
}

function hazardPenalty(lambda: number, hazardRisk: number, pBad: number): number {
  // penalty in strokes; scales with risk appetite, perceived hazard severity, and probability
  const severity = 0.3 + 0.2 * hazardRisk; // 0.5..1.3 strokes swing
  return lambda * severity * pBad;
}

function teeGeometryPenalty(
  club: ClubId,
  meanTotal: number,
  sigTotal: number,
  sigLat: number,
  q: Questionnaire,
  lambda: number
): { penalty: number; notes: string[] } {
  const notes: string[] = [];
  // Apply to common tee clubs
  if (!["D","3W","5W","3H"].includes(club)) return { penalty: 0, notes };

  // Hazard band (downrange) AND side miss
  let pHazard = 0;
  if (q.hazardSide && q.hazardStartYds && q.hazardClearYds && q.hazardClearYds > q.hazardStartYds) {
    const pReach = pBand(meanTotal, sigTotal, q.hazardStartYds, q.hazardClearYds);
    const pSide = pMissSide(sigLat, q.fairwayWidthAtDriverYds ?? null, q.hazardSide);
    pHazard = pReach * pSide; // must both reach the band and miss to that side
    if (pHazard > 0.005) notes.push(`accounts for ${q.hazardSide} hazard ${q.hazardStartYds.toFixed(0)}–${q.hazardClearYds.toFixed(0)}y`);
  }

  // Fairway miss probability (any side) — apply **only to Driver** per spec
  let pMissFW = 0;
  if (club === "D" && q.fairwayWidthAtDriverYds && q.fairwayWidthAtDriverYds > 0) {
    const pIn = pWithinFairway(sigLat, q.fairwayWidthAtDriverYds);
    pMissFW = 1 - pIn;
    if (pMissFW > 0.01) notes.push(`prefers staying within ${q.fairwayWidthAtDriverYds.toFixed(0)}y fairway at driver length`);
  }

  // Stronger severity on tee hazards to reflect big stroke swing from bunkers/penalty
  const hazardSev = 1.2 + 0.35 * (q.hazardRisk ?? 3); // ~1.55..2.95 strokes swing
  const fwSev = 0.2 + 0.05 * (q.hazardRisk ?? 3);      // ~0.25..0.45 strokes
  const penalty = lambda * (hazardSev * pHazard + fwSev * pMissFW);
  return { penalty, notes };
}

// Suggest a pre-hazard layup carry target (center of a buffer before hazard start)
function layupTargetBeforeHazard(q: Questionnaire, bufferYds = 15): number | null {
  if (!q.hazardStartYds) return null;
  return Math.max(0, q.hazardStartYds - bufferYds);
}

function evaluateCandidate(
  club: ClubId,
  targetCarry: number, // target carry to landing zone center
  aimLat: number,      // aiming adjustment in yards (+ right, − left)
  shape: Shape,
  input: ShotInput
): CandidateEval {
  const { ppm, env, q, distanceToHole } = input;

  // Adjusted performance
  const adjCarry = adjustCarry(ppm, club, env, q.lie);
  const adjTotal = adjustTotal(ppm, club, env, q.lie);
  const { sigCarry, sigLat } = dispersion(ppm, club, env, q.stance, shape, ppm.dominantHand);

  // We choose swing that *on average* lands at targetCarry (simple offset)
  const carryOffset = targetCarry - adjCarry;

  // Expected leave distance to the hole after roll-out toward total
  const expectedTotal = adjTotal + carryOffset; // mean total toward target design
  const leaveYds = Math.max(0, distanceToHole - expectedTotal);

  // Safety: probability we blow past/back more than a safety buffer
  const buf = safetyBufferYards(q.hazardRisk, q.pinPos);
  const pLongShort = probabilityTailRiskBeyond(buf, sigCarry);

  // Lateral safety (trees, water flanks) approximated via same buffer and lateral sigma
  const pWide = probabilityTailRiskBeyond(buf, sigLat);

  const lambda = riskLambda(ppm.handicap, q.confidence);
  let riskPenaltyTotal = hazardPenalty(lambda, q.hazardRisk, 0.6 * pLongShort + 0.4 * pWide);

  // Tee geometry on tee shots
  const sigTotal = sigCarry * 1.1; // crude link from carry σ to total σ
  if (q.lie === "tee") {
    const { penalty, notes } = teeGeometryPenalty(club, expectedTotal, sigTotal, sigLat, q, lambda);
    riskPenaltyTotal += penalty;
  }

  // Expected strokes after this shot
  const leaveLie: Lie = leaveYds < 5 ? "fairway" : q.lie; // crude: assuming approach ends fairway/fringe-ish if short; replace with map
  let eStrokes = expectedStrokesToHole(leaveYds, leaveLie) + 1; // +1 for the current swing
  eStrokes += riskPenaltyTotal;

  const reasons: string[] = [];
  if (q.pinPos === "front") reasons.push("protected front pin");
  if (q.pinPos === "back") reasons.push("back stop protection");
  if (q.hazardRisk >= 4) reasons.push("elevated hazard risk");
  if (q.requiredShape !== "any") reasons.push(`shape bias: ${q.requiredShape}`);
  if (q.lie === "tee" && q.hazardSide && q.hazardStartYds && q.hazardClearYds) {
    reasons.push(`respects ${q.hazardSide} hazard ${q.hazardStartYds.toFixed(0)}–${q.hazardClearYds.toFixed(0)}y`);
  }
  if (q.lie === "tee" && q.fairwayWidthAtDriverYds && club === "D") {
    reasons.push(`accounts for fairway narrowing to ${q.fairwayWidthAtDriverYds.toFixed(0)}y at driver length`);
  }
  // Explain lie-based distance reduction and club-up suggestion
  const liePctInfo = lieCarryPenaltyPct(q.lie);
  if (liePctInfo > 0) {
    const clubsUpApprox = Math.max(1, Math.round(liePctInfo / 0.08)); // ~1 club ≈ 8%
    reasons.push(`lie reduces carry ~${(liePctInfo * 100).toFixed(0)}% → club up ~${clubsUpApprox}`);
  }

  return { club, targetCarry, intendedShape: shape, aimLateralYds: aimLat, expStrokes: eStrokes, leaveYds, leaveLie, reasons };
}

function makeCandidates(input: ShotInput): { label: string; plans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> }[] {
  const { distanceToHole, ppm, q, env } = input as ShotInput & { env: Environment };
  const options: { label: string; plans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> }[] = [];

  // 0) Tee-ball realistic targets if on tee: plan to hit typical carries (not hole-based)
  if (q.lie === "tee") {
    const teePlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
    (["D","3W","3H","5W"] as ClubId[]).forEach((club) => {
      const targetCarry = Math.max(0, adjustCarry(ppm, club, env, q.lie));
      teePlans.push({ club, targetCarry, aim: q.hazardSide === "right" ? -5 : q.hazardSide === "left" ? 5 : 0, shape: q.requiredShape === "any" ? ppm.preferredShape : q.requiredShape });
    });
    options.push({ label: "Tee-ball options (attack)", plans: teePlans });

    // Hazard-aware layup before start of hazard band
    const layTarget = layupTargetBeforeHazard(q, 15);
    if (layTarget !== null) {
      const layPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
      (["3W","5W","3H","4i","5i"] as ClubId[]).forEach((club) => {
        layPlans.push({ club, targetCarry: layTarget, aim: q.hazardSide === "right" ? -5 : 5, shape: "straight" });
      });
      options.push({ label: "Tee layup before hazard", plans: layPlans });
    }
  }

  // 1) Attack center with appropriate clubs (approach)
  const centerPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  (Object.keys(ppm.clubs) as ClubId[]).forEach((club) => {
    const targetCarry = Math.max(0, distanceToHole - 10); // assume some roll-out toward pin
    centerPlans.push({ club, targetCarry, aim: 0, shape: q.requiredShape === "any" ? ppm.preferredShape : q.requiredShape });
  });
  options.push({ label: "Center attack (filtered)", plans: centerPlans });

  // 2) Front-safe target (approach): hedge short of pin when front hazards exist
  const shortPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  const shortBias = safetyBufferYards(q.hazardRisk, q.pinPos) + (q.pinPos === "front" ? 4 : 0);
  (Object.keys(ppm.clubs) as ClubId[]).forEach((club) => {
    const targetCarry = Math.max(0, distanceToHole - 20 - shortBias);
    shortPlans.push({ club, targetCarry, aim: 0, shape: q.requiredShape === "any" ? ppm.preferredShape : q.requiredShape });
  });
  options.push({ label: "Front-safe", plans: shortPlans });

  // 3) Lay-up windows to preferred distances (approach 80/95/110y)
  const lays: number[] = [80, 95, 110];
  const layPlansApproach: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  (Object.keys(ppm.clubs) as ClubId[]).forEach((club) => {
    lays.forEach((leave) => {
      const targetCarry = Math.max(0, distanceToHole - leave);
      layPlansApproach.push({ club, targetCarry, aim: 0, shape: q.requiredShape === "any" ? ppm.preferredShape : q.requiredShape });
    });
  });
  options.push({ label: "Lay-up windows (approach)", plans: layPlansApproach });

  return options;
}

function recommend(input: ShotInput) {
  const candidates = makeCandidates(input);
  const evals: CandidateEval[] = [];
  for (const bucket of candidates) {
    for (const plan of bucket.plans) {
      // Filter out absurd plans (e.g., LW for 230y attack)
      if (plan.targetCarry > input.ppm.clubs[plan.club].total * 1.15) continue;
      evals.push(
        evaluateCandidate(plan.club, plan.targetCarry, plan.aim, plan.shape, input)
      );
    }
  }
  evals.sort((a, b) => a.expStrokes - b.expStrokes);
  const best = evals[0];
  let backup = evals.find(e => e.club !== best.club);
  const adj = evals.filter(e => e.club !== best.club && Math.abs(clubIndex(e.club) - clubIndex(best.club)) === 1);
  if (adj.length && backup) {
    const bestAdj = adj.reduce((m, e) => (e.expStrokes < m.expStrokes ? e : m), adj[0]);
    const EPS = 0.03; // favor adjacent club if within 0.03 strokes
    if (bestAdj.expStrokes <= backup.expStrokes + EPS) {
      backup = bestAdj;
    }
  }
  return { best, backup, list: evals };
}

// ---------- Tiny self-test harness (runs in UI) ----------

type TestResult = { name: string; pass: boolean; got?: number | string; expected?: string };

function approx(a: number, b: number, tol = 1e-3) { return Math.abs(a - b) <= tol; }

function runSelfTests(): TestResult[] {
  const results: TestResult[] = [];

  // erf(0)=0
  const e0 = erf(0);
  results.push({ name: "erf(0) = 0", pass: approx(e0, 0), got: e0, expected: "≈ 0" });

  // erf symmetry
  const e1 = erf(1), em1 = erf(-1);
  results.push({ name: "erf symmetry", pass: approx(e1, -em1), got: `${e1.toFixed(6)} & ${em1.toFixed(6)}`, expected: "erf(1) = -erf(-1)" });

  // Φ(0)=0.5
  const p0 = phiCDF(0);
  results.push({ name: "Phi(0) = 0.5", pass: approx(p0, 0.5, 1e-6), got: p0, expected: "0.5" });

  // Tail prob at buffer=0 is 1 (two-sided)
  const t0 = probabilityTailRiskBeyond(0, 10);
  results.push({ name: "TailProb buffer=0 => 1", pass: approx(t0, 1, 1e-6), got: t0, expected: "1" });

  // Monotonic tail: larger buffer => smaller probability
  const tSmall = probabilityTailRiskBeyond(5, 10);
  const tLarge = probabilityTailRiskBeyond(10, 10);
  results.push({ name: "Tail decreases with buffer", pass: tLarge < tSmall, got: `${tSmall.toFixed(3)} -> ${tLarge.toFixed(3)}`, expected: "decreasing" });

  // Hazard penalty increases with hazardRisk
  const hp1 = hazardPenalty(1.0, 1, 0.2);
  const hp5 = hazardPenalty(1.0, 5, 0.2);
  results.push({ name: "Hazard penalty grows with risk", pass: hp5 > hp1, got: `${hp1.toFixed(3)} -> ${hp5.toFixed(3)}`, expected: ">" });

  // Fairway geometry sanity
  const pIn0 = pWithinFairway(5, 0);
  results.push({ name: "Fairway width 0 => P(in)=0", pass: approx(pIn0, 0, 1e-6), got: pIn0, expected: "0" });
  const pInWide = pWithinFairway(5, 1000);
  results.push({ name: "Very wide fairway => P(in)≈1", pass: approx(pInWide, 1, 1e-3), got: pInWide.toFixed(4), expected: "≈1" });
  const pOverFar = pBeyondThreshold(200, 10, 1000);
  results.push({ name: "Far hazard => P(over)≈0", pass: approx(pOverFar, 0, 1e-6), got: pOverFar, expected: "≈0" });

  // Band probability sanity
  const pBandFar = pBand(220, 12, 400, 430);
  results.push({ name: "Band far away => ≈0", pass: approx(pBandFar, 0, 1e-6), got: pBandFar.toFixed(6), expected: "≈0" });
  const pBandInside = pBand(255, 12, 250, 265);
  results.push({ name: "Band around mean => sizable", pass: pBandInside > 0.3, got: pBandInside.toFixed(3), expected: "> 0.3" });

  // One-sided miss shrinks with width
  const missTight = pMissSide(10, 25, 'right');
  const missWide = pMissSide(10, 60, 'right');
  results.push({ name: "One-sided miss drops as width grows", pass: missWide < missTight, got: `${missTight.toFixed(3)} -> ${missWide.toFixed(3)}`, expected: "decreasing" });

  // Driver width applies only to Driver (sanity)
  const qTest: Questionnaire = { lie: "tee", stance: "flat", pinPos: "middle", hazardRisk: 3, requiredShape: "any", confidence: 3, fairwayWidthAtDriverYds: 15, hazardSide: null, hazardStartYds: null, hazardClearYds: null };
  const penD = teeGeometryPenalty("D", 260, 12, 12, qTest, 1).penalty;
  const pen3W = teeGeometryPenalty("3W", 240, 12, 12, qTest, 1).penalty;
  results.push({ name: "Driver width penalty > 3W", pass: penD > pen3W, got: `${penD.toFixed(3)} vs ${pen3W.toFixed(3)}`, expected: ">" });

  // NEW: Layup should beat Driver when right hazard 250–265y and 15y fairway
  const ppm = defaultPPM;
  const env = { ...defaultEnv, windDir: "cross_right", windSpeed: 12 } as Environment; // crosswind scenario
  const qHaz: Questionnaire = {
    lie: "tee",
    stance: "flat",
    pinPos: "middle",
    hazardRisk: 4,
    requiredShape: "any",
    confidence: 3,
    fairwayWidthAtDriverYds: 15,
    hazardSide: "right",
    hazardStartYds: 250,
    hazardClearYds: 265,
  };
  const distanceToHole = 420;
  const driverTarget = adjustCarry(ppm, "D", env, "tee");
  const layTarget = layupTargetBeforeHazard(qHaz, 15)!;
  const input: ShotInput = { distanceToHole, ppm, env, q: qHaz };
  const evalDriver = evaluateCandidate("D", driverTarget, -5, ppm.preferredShape, input);
  const evalLay = evaluateCandidate("5W", layTarget, -5, "straight", input);
  results.push({ name: "Hazard scenario: Layup beats Driver", pass: evalLay.expStrokes < evalDriver.expStrokes, got: `${evalDriver.expStrokes.toFixed(2)} vs ${evalLay.expStrokes.toFixed(2)}`, expected: "layup < driver" });

  // NEW: Crosswind + shape: fade should reduce σ in R→L wind; draw should increase
  const baseBoost = 0.5 * 15; // BASE_SIGMA_PER_MPH * windSpeed
  const envWind: Environment = { ...defaultEnv, windDir: "cross_right", windSpeed: 15 };
  const sigFade = crosswindSigmaBoost(envWind, "fade", "R");
  const sigDraw = crosswindSigmaBoost(envWind, "draw", "R");
  results.push({ name: "Crosswind neutralized by fade", pass: sigFade < baseBoost, got: `${sigFade.toFixed(2)} < ${baseBoost.toFixed(2)}`, expected: "reduced" });
  results.push({ name: "Crosswind amplified by draw", pass: sigDraw > baseBoost, got: `${sigDraw.toFixed(2)} > ${baseBoost.toFixed(2)}`, expected: "increased" });

  return results;
}

// ---------- Voice chat (STT + TTS) ----------
function useVoiceChat() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any | null>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      try {
        const t = e?.results?.[0]?.[0]?.transcript ?? "";
        setTranscript(t);
        onResultRef.current?.(t);
      } catch {}
    };
    rec.onerror = (e: any) => setError(String(e?.error || "speech error"));
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, []);

  const start = (onResult?: (text: string) => void) => {
    onResultRef.current = onResult || null;
    setTranscript("");
    setError(null);
    try {
      recRef.current?.start();
      setListening(true);
    } catch (err: any) {
      setError(err?.message || "start error");
    }
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  };

  const speak = (text: string) => {
    if (!text || typeof text !== "string") return;
    try {
      window.speechSynthesis?.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      u.pitch = 1;
      u.volume = 0.8;
      u.onstart = () => console.log("🔊 Speech started:", text);
      u.onend = () => console.log("🔊 Speech ended");
      u.onerror = (e) => console.error("🔊 Speech error:", e);
      window.speechSynthesis?.speak(u);
    } catch (err) {
      console.error("🔊 Speech synthesis error:", err);
    }
  };

  return { supported, listening, transcript, error, start, stop, speak };
}

function parseVoiceCommand(text: string, q: Questionnaire) {
  const t = text.toLowerCase();
  const words = t.split(' ').filter(Boolean);
  const upd: Partial<Questionnaire> = {};
  let distance: number | null = null;
  let action: "speakRec" | null = null;

  console.log('🎤 Parsing voice command:', text);

  // Distance command - multiple patterns
  const distanceMatch = t.match(/(?:distance|yards?)\s*(\d+)/);
  if (distanceMatch) {
    distance = parseInt(distanceMatch[1]);
    console.log('✅ Found distance:', distance);
  }

  // Hazard side + numbers (start, clear)
  if (t.indexOf('hazard') >= 0 || t.indexOf('bunker') >= 0 || t.indexOf('water') >= 0) {
    if (t.indexOf('left') >= 0) upd.hazardSide = 'left';
    if (t.indexOf('right') >= 0) upd.hazardSide = 'right';
    const nums = words.map(w => parseFloat(w)).filter(n => Number.isFinite(n)) as number[];
    if (nums.length >= 1) upd.hazardStartYds = nums[0];
    if (nums.length >= 2) upd.hazardClearYds = nums[1];
    console.log('✅ Found hazard:', upd);
  }

  // Fairway width at driver
  if (t.indexOf('fairway') >= 0 && (t.indexOf('width') >= 0 || t.indexOf('narrows') >= 0 || t.indexOf('narrow') >= 0)) {
    const n = words.map(w => parseFloat(w)).find(n => Number.isFinite(n));
    if (typeof n === 'number') {
      upd.fairwayWidthAtDriverYds = n;
      console.log('✅ Found fairway width:', n);
    }
  }

  // Wind commands
  const windMatch = t.match(/wind\s*(\d+)(?:\s*mph)?\s*(head|tail|left|right)?/);
  if (windMatch) {
    console.log('✅ Found wind command:', windMatch);
  }

  // Lie
  const li = words.indexOf('lie');
  if (li >= 0) {
    const next = (words[li+1] || '');
    const map: any = { 'light': 'light_rough', 'heavy': 'heavy_rough', 'tee': 'tee', 'fairway': 'fairway', 'sand': 'sand', 'bunker': 'sand', 'recovery': 'recovery' };
    upd.lie = (map[next] || upd.lie) as Lie;
  }

  // Pin position
  const pi = words.indexOf('pin');
  if (pi >= 0) {
    const next = (words[pi+1] || '');
    if (next === 'front' || next === 'middle' || next === 'back') upd.pinPos = next as PinPos;
  }

  // Confidence
  const ci = words.indexOf('confidence');
  if (ci >= 0) {
    const n = parseFloat(words[ci+1] || '');
    if (Number.isFinite(n)) upd.confidence = Math.max(1, Math.min(5, Math.round(n))) as Questionnaire['confidence'];
  }

  if (t.indexOf("what's the play") >= 0 || t.indexOf('whats the play') >= 0 || t.indexOf('recommend') >= 0 || t.indexOf('what should i hit') >= 0) {
    action = 'speakRec';
    console.log('✅ Found recommendation request');
  }

  console.log('🎤 Parse result:', { upd, distance, action });
  return { upd, distance, action };
}

function describeRecommendation(best?: CandidateEval, backup?: CandidateEval | null, q?: Questionnaire) {
  let s = '';
  if (q) {
    if (q.hazardSide && q.hazardStartYds) s += `There is a ${q.hazardSide} hazard starting at ${Math.round(q.hazardStartYds)} yards. `;
    if (q.hazardSide && q.hazardClearYds) s += `To clear it we need to land at ${Math.round(q.hazardClearYds)} yards. `;
    if (q.fairwayWidthAtDriverYds) s += `The fairway narrows to about ${Math.round(q.fairwayWidthAtDriverYds)} yards at driver length. `;
  }
  if (best) {
    const aim = best.aimLateralYds === 0 ? 'center' : `${Math.abs(best.aimLateralYds)} yards ${best.aimLateralYds > 0 ? 'right' : 'left'}`;
    s += `Primary is ${best.club}, aim ${aim}, carry ${Math.round(best.targetCarry)}. `;
  } else {
    s += 'No clear primary recommendation. ';
  }
  if (backup) s += `Backup is ${backup.club}.`;
  return s;
}

// ---------- UI ----------

export default function CaddyAIV2() {
  const [distance, setDistance] = useState(152);
  const [ppm, setPPM] = useState<PPM>(defaultPPM);
  // --- Persist PPM to localStorage ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ppm_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.clubs) setPPM(parsed);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('ppm_v1', JSON.stringify(ppm)); } catch {}
  }, [ppm]);
  const [env, setEnv] = useState<Environment>(defaultEnv);
  const [q, setQ] = useState<Questionnaire>(defaultQ);

  const { best, backup, list } = useMemo(() => recommend({ distanceToHole: distance, ppm, env, q }), [distance, ppm, env, q]);
  const tests = useMemo(() => runSelfTests(), []);

  // Voice chat
  const voice = useVoiceChat();
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Lie club-up hint for UI
  const liePctUI = lieCarryPenaltyPct(q.lie);
  const approxClubsUp = liePctUI > 0 ? Math.max(1, Math.round(liePctUI / 0.08)) : 0;

  const onVoiceResult = async (text: string) => {
    console.log('🎤 Voice heard:', text);
    
    // Try local parsing first for simple commands
    const { upd, distance: dist, action } = parseVoiceCommand(text, q);
    console.log('🔍 Local parsing result:', { upd, dist, action });
    
    // Handle simple distance updates immediately
    if (dist != null && !Number.isNaN(dist)) {
      console.log('✅ Setting distance locally:', dist);
      setDistance(Math.round(dist));
      voice.speak(`Got it, ${Math.round(dist)} yards to the pin`);
      return;
    }
    
    // Handle other simple updates
    if (Object.keys(upd).length > 0) {
      console.log('✅ Updating questionnaire locally:', upd);
      setQ({ ...q, ...upd });
      voice.speak('Updated');
    }
      
    // Handle recommendation requests
    if (action === 'speakRec') {
      const { best: bestNext, backup: backupNext } = recommend({ distanceToHole: distance, ppm, env, q });
      voice.speak(describeRecommendation(bestNext, backupNext, q));
      return;
    }
    
    // For complex commands, try GPT API
    let updated = false;
    
    if (Object.keys(upd).length) {
      console.log('🔄 Updating questionnaire:', upd);
      setQ({ ...q, ...upd });
      updated = true;
    }
    
    if (dist != null && !Number.isNaN(dist)) {
      console.log('🔄 Updating distance to:', dist);
      setDistance(Math.round(dist));
      voice.speak(`Got it, ${dist} yards to the pin.`);
      updated = true;
    }
    
    if (action === 'speakRec' || updated) {
      // Use updated values for recommendation
      const nextQ = { ...q, ...upd };
      const nextDistance = dist ?? distance;
      const { best: bestNext, backup: backupNext } = recommend({ 
        distanceToHole: nextDistance, 
        ppm, 
        env, 
        q: nextQ 
      });
      voice.speak(describeRecommendation(bestNext, backupNext, nextQ));
    }
  };

  useEffect(() => {
    if (autoSpeak && best) {
      voice.speak(describeRecommendation(best, backup, q));
    }
  }, [autoSpeak, best?.club, best?.targetCarry, best?.aimLateralYds, backup?.club, q.hazardSide, q.hazardStartYds, q.hazardClearYds, q.fairwayWidthAtDriverYds]);

  return (
    <div className="w-full max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <header className="flex items-center gap-3">
          <Flag className="text-emerald-600" />
          <h1 className="text-2xl font-semibold">CaddyAI v2.3 — Shot Planner</h1>
        </header>

        {/* Conversational caddie prompts */}
        {q.lie === "tee" && (
        <section className="p-4 bg-white/90 rounded-2xl shadow border border-emerald-100">
          <div className="text-sm text-gray-800">
            <div className="font-semibold mb-2">Quick Caddie Chat</div>
            <p className="text-gray-700">Example: <em>bunker on the right starts at 250y — need 265y to clear; fairway narrows to 15y at driver</em>.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div>
                <label className="text-xs font-medium">Hazard side</label>
                <select value={q.hazardSide ?? ''} onChange={(e)=> setQ({ ...q, hazardSide: (e.target.value || null) as Questionnaire['hazardSide'] })} className="mt-1 w-full rounded-xl border p-2">
                  <option value="">None</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Hazard starts at (y)</label>
                <input type="number" placeholder="e.g., 250" value={q.hazardStartYds ?? ''}
                  onChange={(e)=> setQ({ ...q, hazardStartYds: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded-xl border p-2"/>
              </div>
              <div>
                <label className="text-xs font-medium">Need to carry to clear (y)</label>
                <input type="number" placeholder="e.g., 265" value={q.hazardClearYds ?? ''}
                  onChange={(e)=> setQ({ ...q, hazardClearYds: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded-xl border p-2"/>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-xs font-medium">Fairway narrows to (y) at my driver length</label>
                <input type="number" placeholder="e.g., 15" value={q.fairwayWidthAtDriverYds ?? ''}
                  onChange={(e)=> setQ({ ...q, fairwayWidthAtDriverYds: e.target.value === '' ? null : parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded-xl border p-2"/>
                <div className="text-[11px] text-gray-500 mt-1">Width where your driver typically lands.</div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Voice Caddie (STT + TTS) */}
        <section className="p-4 bg-white/90 rounded-2xl shadow border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Voice Caddie</div>
              <div className="text-xs text-gray-600">Tap the mic and say: "hazard right 250 clear 265", "fairway width 15", "distance 152", or "what's the play?"</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-2 rounded-xl shadow border ${voice.listening ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-gray-800'}`}
                onClick={() => voice.listening ? voice.stop() : voice.start(onVoiceResult)}
                title={voice.listening ? 'Stop listening' : 'Start listening'}
              >
                {voice.listening ? <MicOff size={18}/> : <Mic size={18}/>} {voice.listening ? 'Stop' : 'Speak'}
              </button>
              <button
                className="px-3 py-2 rounded-xl shadow border bg-white text-gray-800"
                onClick={() => voice.speak(describeRecommendation(best, backup, q))}
                title="Read current recommendation"
              >
                <Volume2 size={18}/> Read Rec
              </button>
              <label className="flex items-center gap-1 text-xs text-gray-600 ml-2">
                <input type="checkbox" checked={autoSpeak} onChange={(e)=> setAutoSpeak(e.target.checked)} />
                Auto-read updates
              </label>
            </div>
          </div>
          {voice.supported ? (
            <div className="mt-2 text-sm text-gray-800">
              {voice.transcript ? (
                <div className="p-2 rounded bg-emerald-50 text-emerald-800">Heard: "{voice.transcript}"</div>
              ) : (
                <div className="text-gray-500 text-xs">Mic off. Examples: "lie fairway", "pin front", "confidence 4".</div>
              )}
              {voice.error && <div className="text-rose-600 text-xs mt-1">Voice error: {voice.error}</div>}
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-600">Voice not supported in this browser. Chrome desktop/Android work best. iOS Safari requires a tap to start audio.</div>
          )}
        </section>

        {/* Core inputs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/70 rounded-2xl shadow">
            <label className="text-sm font-medium">Distance to Hole (yds)</label>
            <input type="number" value={distance} onChange={(e) => setDistance(parseInt(e.target.value || "0", 10))} className="mt-2 w-full rounded-xl border p-2" />

            <label className="text-sm font-medium mt-4 block">Pin Position</label>
            <select value={q.pinPos} onChange={(e) => setQ({ ...q, pinPos: e.target.value as PinPos })} className="mt-2 w-full rounded-xl border p-2">
              <option value="front">Front</option>
              <option value="middle">Middle</option>
              <option value="back">Back</option>
            </select>

            <label className="text-sm font-medium mt-4 block">Required Shape</label>
            <select value={q.requiredShape} onChange={(e) => setQ({ ...q, requiredShape: e.target.value as Shape })} className="mt-2 w-full rounded-xl border p-2">
              <option value="any">Any</option>
              <option value="draw">Draw</option>
              <option value="fade">Fade</option>
              <option value="straight">Straight</option>
            </select>
          </div>

          <div className="p-4 bg-white/70 rounded-2xl shadow">
            <label className="text-sm font-medium">Lie</label>
            <select value={q.lie} onChange={(e) => setQ({ ...q, lie: e.target.value as Lie })} className="mt-2 w-full rounded-2xl border p-2">
              <option value="tee">Tee</option>
              <option value="fairway">Fairway</option>
              <option value="light_rough">Light Rough</option>
              <option value="heavy_rough">Heavy Rough</option>
              <option value="sand">Sand</option>
              <option value="recovery">Recovery</option>
            </select>
            {q.lie !== 'tee' && q.lie !== 'fairway' && (
              <div className="mt-2 text-[12px] text-amber-800 bg-amber-50 rounded-lg p-2">
                Lie effect: −{(lieCarryPenaltyPct(q.lie) * 100).toFixed(0)}% carry.
                <span className="ml-1">Suggest club up ~{approxClubsUp} club{approxClubsUp > 1 ? 's' : ''}.</span>
              </div>
            )}

            <label className="text-sm font-medium mt-4 block">Stance</label>
            <select value={q.stance} onChange={(e) => setQ({ ...q, stance: e.target.value as Stance })} className="mt-2 w-full rounded-xl border p-2">
              <option value="flat">Flat</option>
              <option value="ball_above">Ball Above Feet</option>
              <option value="ball_below">Ball Below Feet</option>
              <option value="uphill">Uphill</option>
              <option value="downhill">Downhill</option>
            </select>

            <label className="text-sm font-medium mt-4 block">Hazard Risk (1-5)</label>
            <input type="range" min={1} max={5} value={q.hazardRisk} onChange={(e) => setQ({ ...q, hazardRisk: Number(e.target.value) as Questionnaire["hazardRisk"] })} className="mt-2 w-full" />
            <div className="text-xs text-gray-600">Perceived danger: {q.hazardRisk}</div>
          </div>

          <div className="p-4 bg-white/70 rounded-2xl shadow">
            <div className="flex items-center gap-2">
              <Wind className="text-sky-600" />
              <label className="text-sm font-medium">Wind</label>
            </div>
            <input type="number" min={0} value={env.windSpeed} onChange={(e) => setEnv({ ...env, windSpeed: parseFloat(e.target.value || "0") })} className="mt-2 w-full rounded-xl border p-2" />
            <select value={env.windDir} onChange={(e) => setEnv({ ...env, windDir: e.target.value as Environment["windDir"] })} className="mt-2 w-full rounded-xl border p-2">
              <option value="head">Headwind</option>
              <option value="tail">Tailwind</option>
              <option value="cross_left">Cross (Left to Right)</option>
              <option value="cross_right">Cross (Right to Left)</option>
            </select>

            <label className="text-sm font-medium mt-4 block">Elevation to Target (ft)</label>
            <input type="number" value={env.elevationFt} onChange={(e) => setEnv({ ...env, elevationFt: parseFloat(e.target.value || "0") })} className="mt-2 w-full rounded-xl border p-2" />

            <label className="text-sm font-medium mt-4 block">Air Temp (°F)</label>
            <input type="number" value={env.temperatureF} onChange={(e) => setEnv({ ...env, temperatureF: parseFloat(e.target.value || "0") })} className="mt-2 w-full rounded-xl border p-2" />

            <label className="text-sm font-medium mt-4 block">Altitude (ft ASL)</label>
            <input type="number" value={env.altitudeFt} onChange={(e) => setEnv({ ...env, altitudeFt: parseFloat(e.target.value || "0") })} className="mt-2 w-full rounded-xl border p-2" />

            <label className="text-sm font-medium mt-4 block">Green Firmness</label>
            <select value={env.greenFirm} onChange={(e) => setEnv({ ...env, greenFirm: e.target.value as Environment["greenFirm"] })} className="mt-2 w-full rounded-xl border p-2">
              <option value="soft">Soft</option>
              <option value="medium">Medium</option>
              <option value="firm">Firm</option>
            </select>

            <label className="text-sm font-medium mt-4 block">Moment Confidence (1-5)</label>
            <input type="range" min={1} max={5} value={q.confidence} onChange={(e) => setQ({ ...q, confidence: Number(e.target.value) as Questionnaire["confidence"] })} className="mt-2 w-full" />
            <div className="text-xs text-gray-600">Confidence: {q.confidence}</div>
          </div>
        </section>

        <section className="p-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><ArrowRight className="text-emerald-600"/> Your Caddie Says</h2>
          {(best || backup) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {best && (
                <div className="p-4 rounded-xl bg-white shadow-inner border border-emerald-100">
                  <div className="text-xs uppercase tracking-wide text-emerald-600">Primary</div>
                  <div className="text-3xl font-bold text-emerald-700">{best.club}</div>
                  <div className="mt-1 text-gray-700">Aim: {best.aimLateralYds > 0 ? `${Math.abs(best.aimLateralYds)}y R` : best.aimLateralYds < 0 ? `${Math.abs(best.aimLateralYds)}y L` : "Center"}</div>
                  <div className="text-gray-700">Target carry: {best.targetCarry.toFixed(0)} yds</div>
                  <div className="text-gray-700">Shape: {best.intendedShape}</div>
                  <div className="mt-2 text-gray-500">E[strokes after shot]: {best.expStrokes.toFixed(2)}</div>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                    {best.reasons.length ? best.reasons.map((r, i) => (<li key={i}>{r}</li>)) : <li>Optimal expected leave & risk balance</li>}
                  </ul>
                </div>
              )}
              {backup && (
                <div className="p-4 rounded-xl bg-white shadow-inner">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Backup</div>
                  <div className="text-3xl font-bold text-gray-800">{backup.club}</div>
                  <div className="mt-1 text-gray-700">Aim: {backup.aimLateralYds > 0 ? `${Math.abs(backup.aimLateralYds)}y R` : backup.aimLateralYds < 0 ? `${Math.abs(backup.aimLateralYds)}y L` : "Center"}</div>
                  <div className="text-gray-700">Target carry: {backup.targetCarry.toFixed(0)} yds</div>
                  <div className="text-gray-700">Shape: {backup.intendedShape}</div>
                  <div className="mt-2 text-gray-500">E[strokes after shot]: {backup.expStrokes.toFixed(2)}</div>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                    {backup.reasons.length ? backup.reasons.map((r, i) => (<li key={i}>{r}</li>)) : <li>Solid alternative if conditions change</li>}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No feasible plan; consider laying up aggressively.</div>
          )}
        </section>
        {(best || backup) && (
          <section className="p-4 bg-white/90 rounded-2xl shadow border border-emerald-100">
            <h3 className="font-semibold mb-2">Next Shot</h3>
            <div className="text-sm text-gray-700">
              {best && (<div>Primary leaves about <b>{Math.round(best.leaveYds)}y</b> (~{best.leaveLie}).</div>)}
              {backup && (<div>Backup leaves about <b>{Math.round(backup.leaveYds)}y</b> (~{backup.leaveLie}).</div>)}
            </div>
            <div className="flex gap-2 mt-3">
              {best && (
                <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
                  onClick={() => { setDistance(Math.round(best.leaveYds)); setQ({ ...q, lie: best.leaveLie, stance: "flat" }); }}>
                  Use Primary → Next
                </button>
              )}
              {backup && (
                <button className="px-3 py-2 rounded-xl bg-gray-700 text-white shadow hover:bg-gray-800"
                  onClick={() => { setDistance(Math.round(backup.leaveYds)); setQ({ ...q, lie: backup.leaveLie, stance: "flat" }); }}>
                  Use Backup → Next
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        <section className="p-4 bg-white/80 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Other Good Options</h3>
          <div className="space-y-2">
            {list.slice(2, 6).map((t, i) => (
              <div key={i} className={`p-3 rounded-xl bg-gray-50`}>
                <div className="flex justify-between text-sm">
                  <div className="font-medium">{i+3}. {t.club}</div>
                  <div className="text-gray-600">E: {t.expStrokes.toFixed(2)}</div>
                </div>
                <div className="text-xs text-gray-600">carry {t.targetCarry.toFixed(0)}y · {t.intendedShape} · aim {t.aimLateralYds === 0 ? 'center' : `${t.aimLateralYds>0?'+':''}${t.aimLateralYds}y`}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-4 bg-white/80 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Player Model Setup</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs font-medium">Handedness</label>
              <select className="mt-1 w-full rounded-lg border p-2" value={ppm.dominantHand} onChange={(e)=> setPPM({ ...ppm, dominantHand: e.target.value as Hand })}>
                <option value="R">Right</option>
                <option value="L">Left</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Handicap</label>
              <input className="mt-1 w-full rounded-lg border p-2" type="number" min={-5} max={40} value={ppm.handicap} onChange={(e)=> setPPM({ ...ppm, handicap: parseFloat(e.target.value || '0') })} />
            </div>
            <div>
              <label className="text-xs font-medium">Normal Shot</label>
              <select className="mt-1 w-full rounded-lg border p-2" value={ppm.preferredShape} onChange={(e)=> setPPM({ ...ppm, preferredShape: e.target.value as PPM['preferredShape'] })}>
                <option value="draw">Draw</option>
                <option value="fade">Fade</option>
                <option value="straight">Straight</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Ball Flight</label>
              <select className="mt-1 w-full rounded-lg border p-2" value={ppm.trajectory} onChange={(e)=> setPPM({ ...ppm, trajectory: e.target.value as PPM['trajectory'] })}>
                <option value="low">Low</option>
                <option value="mid">Mid</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 mt-2">Autosaves to your browser. Handicap influences risk; Normal Shot biases shape; Ball Flight will factor into wind/elevation tuning later.</div>
        </section>

        <section className="p-4 bg-white/80 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Player Model (PPM)</h3>
          <div className="text-xs text-gray-600 mb-3">Quick tweak: adjust a couple of clubs to roughly match your game.</div>
          {["7i","9i","PW","GW","D"].map((club) => (
            <div key={club} className="grid grid-cols-5 gap-2 items-center mb-2">
              <div className="col-span-1 text-sm font-medium">{club}</div>
              <input type="number" className="col-span-2 rounded-lg border p-1 text-xs" value={ppm.clubs[club as ClubId].carry}
                     onChange={(e)=> setPPM({ ...ppm, clubs: { ...ppm.clubs, [club as ClubId]: { ...ppm.clubs[club as ClubId], carry: parseFloat(e.target.value || '0') } } })} />
              <input type="number" className="col-span-2 rounded-lg border p-1 text-xs" value={ppm.clubs[club as ClubId].total}
                     onChange={(e)=> setPPM({ ...ppm, clubs: { ...ppm.clubs, [club as ClubId]: { ...ppm.clubs[club as ClubId], total: parseFloat(e.target.value || '0') } } })} />
            </div>
          ))}
          <div className="text-[10px] text-gray-500 mt-2">Fields: carry / total (yds)</div>
        </section>

        <section className="p-4 bg-white/80 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Model Notes</h3>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            <li>Distances adjust for temp, altitude, elevation, wind, lie & stance.</li>
            <li>Risk scales with handicap & current confidence.</li>
            <li>Front pins: extra short-side buffer; back pins: long buffer.</li>
            <li>Tee-ball model uses hazard side + band (start/clear) and fairway width (Driver only).</li>
            <li>Automatic pre-hazard layup considered when warranted.</li>
            <li>Replace the toy E[strokes] with SG tables for more realism.</li>
          </ul>
        </section>

        <section className="p-4 bg-white/80 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Self-tests</h3>
          <div className="space-y-2 text-sm">
            {tests.map((t, i) => (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${t.pass ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {t.pass ? <CheckCircle2 className="text-emerald-600 mt-0.5"/> : <XCircle className="text-rose-600 mt-0.5"/>}
                <div>
                  <div className="font-medium">{t.name}</div>
                  {!t.pass && (
                    <div className="text-xs text-gray-600">got: {String(t.got)} · expected: {t.expected}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-gray-500 mt-2">These sanity checks run in-browser and help guard the risk math.</div>
        </section>
      </aside>
    </div>
  );
}