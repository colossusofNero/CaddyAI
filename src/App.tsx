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
import { ArrowRight, Flag, Wind, CheckCircle2, XCircle } from "lucide-react";

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
type BallFlight = "low" | "mid" | "high";
type NormalShot = "draw" | "fade" | "straight";

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
  normalShot: NormalShot;     // natural ball flight
  ballFlight: BallFlight;     // trajectory preference
  clubs: Record<ClubId, ClubSpec>;
  isSetup: boolean;           // whether PPM has been configured
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
  normalShot: "draw",
  ballFlight: "mid",
  isSetup: false,
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
  // Head subtracts full effect, tail adds only 1/3 benefit. Crosswind handled separately via dispersion.
  const factorAt200 = 0.3; // yd/mph
  const scale = nominalCarry / 200;
  if (env.windDir === "tail") return +factorAt200 * env.windSpeed * scale * (1/3); // tailwind gives 1/3 benefit
  if (env.windDir === "head") return -factorAt200 * env.windSpeed * scale;
  return 0;
}

function lateralWindSigmaBoost(env: Environment) {
  // Crosswind increases lateral sigma ~0.5 yd per mph
  if (env.windDir === "cross_left" || env.windDir === "cross_right") {
    return 0.5 * env.windSpeed;
  }
  return 0;
}

function lieCarryPenaltyPct(lie: Lie): number {
  switch (lie) {
    case "tee": return 0;
    case "fairway": return 0;
    case "light_rough": return 0.05;  // 5%
    case "heavy_rough": return 0.10;  // 10%
    case "sand": return 0.15;         // 15%
    case "recovery": return 0.15;     // 15%
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

function dispersion(ppm: PPM, club: ClubId, env: Environment, stance: Stance): { sigCarry: number; sigLat: number } {
  const base = ppm.clubs[club];
  const stanceBoost = stanceDispersionBoost(stance);
  const latWind = lateralWindSigmaBoost(env);
  return {
    sigCarry: base.sigCarry + stanceBoost.carry,
    sigLat: base.sigLat + stanceBoost.lat + latWind,
  };
}

function safetyBufferYards(hazardRisk: number, pinPos: PinPos): number {
  // front pin -> add a touch more front safety; back pin -> add back safety
  const base = 3 + hazardRisk * 1.5; // 4.5..10.5 yards
  return base + (pinPos === "front" || pinPos === "back" ? 1.5 : 0);
}

// ---------- Helper functions for evaluation ----------

function hazardPenalty(probability: number, hazardRisk: number, lambda: number): number {
  // Penalty for hazard risk based on probability and risk level
  const basePenalty = 0.5 + hazardRisk * 0.2; // 0.7 to 1.5 strokes
  return probability * basePenalty * lambda;
}

function probabilityTailRiskBeyond(buffer: number, sigma: number): number {
  // Two-sided tail probability beyond buffer distance
  if (sigma <= 0) return buffer <= 0 ? 1 : 0;
  const z = buffer / sigma;
  return 2 * (1 - phiCDF(z));
}

function teeGeometryPenalty(club: ClubId, targetCarry: number, sigCarry: number, sigLat: number, q: Questionnaire, lambda: number): { penalty: number; reasons: string[] } {
  const reasons: string[] = [];
  let penalty = 0;

  // Driver-specific fairway width penalty
  if (club === "D" && q.fairwayWidthAtDriverYds && q.fairwayWidthAtDriverYds < 30) {
    const pMiss = 1 - pWithinFairway(sigLat, q.fairwayWidthAtDriverYds);
    const widthPenalty = pMiss * 0.3 * lambda;
    penalty += widthPenalty;
    reasons.push(`narrow fairway (${q.fairwayWidthAtDriverYds}y)`);
  }

  // Hazard band penalty
  if (q.hazardSide && q.hazardStartYds && q.hazardClearYds) {
    const pInBand = pBand(targetCarry, sigCarry, q.hazardStartYds, q.hazardClearYds);
    if (pInBand > 0.05) {
      const bandPenalty = hazardPenalty(pInBand, q.hazardRisk, lambda);
      penalty += bandPenalty;
      reasons.push(`${q.hazardSide} hazard ${q.hazardStartYds}-${q.hazardClearYds}y`);
    }
  }

  return { penalty, reasons };
}

function layupTargetBeforeHazard(q: Questionnaire, buffer: number): number | null {
  if (!q.hazardStartYds) return null;
  return Math.max(0, q.hazardStartYds - buffer);
}

function evaluateCandidate(club: ClubId, targetCarry: number, aimLateralYds: number, intendedShape: Shape, input: ShotInput): CandidateEval {
  const { distanceToHole, ppm, env, q } = input;
  
  // Get adjusted club performance
  const actualCarry = adjustCarry(ppm, club, env, q.lie);
  const actualTotal = adjustTotal(ppm, club, env, q.lie);
  const { sigCarry, sigLat } = dispersion(ppm, club, env, q.stance);
  
  // Calculate expected landing position
  const expectedCarry = Math.min(actualCarry, targetCarry);
  const leaveYds = Math.max(0, distanceToHole - actualTotal);
  
  // Determine resulting lie
  let leaveLie: Lie = "fairway";
  if (leaveYds > 200) leaveLie = "fairway";
  else if (leaveYds > 100) leaveLie = "fairway";
  else if (leaveYds > 50) leaveLie = "fairway";
  else leaveLie = "fairway"; // simplified for now
  
  // Base strokes to hole
  let expStrokes = 1 + expectedStrokesToHole(leaveYds, leaveLie);
  
  // Risk adjustments
  const lambda = riskLambda(ppm.handicap, q.confidence);
  const reasons: string[] = [];
  
  // Distance control penalty
  const distanceError = Math.abs(expectedCarry - targetCarry);
  if (distanceError > 10) {
    const distancePenalty = (distanceError / 100) * lambda;
    expStrokes += distancePenalty;
    reasons.push(`distance control (${Math.round(distanceError)}y off)`);
  }
  
  // Confidence penalty
  const confidencePenalty = (5 - q.confidence) * 0.02 * lambda;
  expStrokes += confidencePenalty;
  
  // Tee geometry penalties (for tee shots)
  if (q.lie === "tee") {
    const { penalty, reasons: teeReasons } = teeGeometryPenalty(club, targetCarry, sigCarry, sigLat, q, lambda);
    expStrokes += penalty;
    reasons.push(...teeReasons);
  }
  
  // General hazard risk
  const tailRisk = probabilityTailRiskBeyond(10, sigCarry);
  const hazardPen = hazardPenalty(tailRisk, q.hazardRisk, lambda);
  expStrokes += hazardPen;
  
  return {
    club,
    targetCarry,
    intendedShape,
    aimLateralYds,
    expStrokes,
    leaveYds,
    leaveLie,
    reasons
  };
}

function makeCandidates(input: ShotInput): {
  label: string;
  plans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }>;
}[] {
  const { distanceToHole, ppm, q, env } = input;
  const options: {
    label: string;
    plans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }>;
  }[] = [];

  // If on the tee: offer normal tee-ball carries for common tee clubs
  if (q.lie === "tee") {
    const teePlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
    (["D", "3W", "3H", "5W"] as ClubId[]).forEach((club) => {
      const targetCarry = Math.max(0, adjustCarry(ppm, club, env, q.lie));
      const aim = q.hazardSide === "right" ? -5 : q.hazardSide === "left" ? 5 : 0;
      const shape = q.requiredShape === "any" ? ppm.normalShot : q.requiredShape;
      teePlans.push({ club, targetCarry, aim, shape });
    });
    options.push({ label: "Tee-ball options (attack)", plans: teePlans });

    // If hazard band is provided, add a pre-hazard layup target
    const layTarget = layupTargetBeforeHazard(q, 15);
    if (layTarget !== null) {
      const layPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
      (["3W", "5W", "3H", "4i", "5i"] as ClubId[]).forEach((club) => {
        const aim = q.hazardSide === "right" ? -5 : 5;
        layPlans.push({ club, targetCarry: layTarget, aim, shape: "straight" });
      });
      options.push({ label: "Tee layup before hazard", plans: layPlans });
    }
  }

  // Center attack: aim to carry to ~10y short of hole (allowing for roll)
  const centerPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  (Object.keys(ppm.clubs) as ClubId[]).forEach((club) => {
    const targetCarry = Math.max(0, distanceToHole - 10);
    const shape = q.requiredShape === "any" ? ppm.normalShot : q.requiredShape;
    centerPlans.push({ club, targetCarry, aim: 0, shape });
  });
  options.push({ label: "Center attack (filtered)", plans: centerPlans });

  // Front-safe: hedge extra short when front is dangerous
  const shortPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  const shortBias = safetyBufferYards(q.hazardRisk, q.pinPos) + (q.pinPos === "front" ? 4 : 0);
  (Object.keys(ppm.clubs) as ClubId[]).forEach((club) => {
    const targetCarry = Math.max(0, distanceToHole - 20 - shortBias);
    const shape = q.requiredShape === "any" ? ppm.normalShot : q.requiredShape;
    shortPlans.push({ club, targetCarry, aim: 0, shape });
  });
  options.push({ label: "Front-safe", plans: shortPlans });

  // Preferred lay-up windows for approaches
  const layWindows = [80, 95, 110];
  const layPlansApproach: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  (Object.keys(ppm.clubs) as ClubId[]).forEach((club) => {
    layWindows.forEach((leave) => {
      const targetCarry = Math.max(0, distanceToHole - leave);
      const shape = q.requiredShape === "any" ? ppm.normalShot : q.requiredShape;
      layPlansApproach.push({ club, targetCarry, aim: 0, shape });
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
  const env = defaultEnv;
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
  const evalDriver = evaluateCandidate("D", driverTarget, -5, ppm.normalShot, input);
  const evalLay = evaluateCandidate("5W", layTarget, -5, "straight", input);
  results.push({ name: "Hazard scenario: Layup beats Driver", pass: evalLay.expStrokes < evalDriver.expStrokes, got: `${evalDriver.expStrokes.toFixed(2)} vs ${evalLay.expStrokes.toFixed(2)}`, expected: "layup < driver" });

  return results;
}

// ---------- UI ----------

function CaddyAIV2() {
  const [distance, setDistance] = useState(152);
  const [ppm, setPPM] = useState<PPM>(() => {
    const saved = localStorage.getItem('caddy-ppm');
    return saved ? JSON.parse(saved) : defaultPPM;
  });
  const [env, setEnv] = useState<Environment>(defaultEnv);
  const [q, setQ] = useState<Questionnaire>(defaultQ);
  const [showPPMSetup, setShowPPMSetup] = useState(false);
  const [tempPPM, setTempPPM] = useState<PPM>(ppm);

  // Save PPM to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('caddy-ppm', JSON.stringify(ppm));
  }, [ppm]);

  const { best, backup, list } = useMemo(() => recommend({ distanceToHole: distance, ppm, env, q }), [distance, ppm, env, q]);
  const tests = useMemo(() => runSelfTests(), []);

  const handleSavePPM = () => {
    setPPM({ ...tempPPM, isSetup: true });
    setShowPPMSetup(false);
  };

  const handleSkipPPM = () => {
    setPPM({ ...defaultPPM, isSetup: true });
    setShowPPMSetup(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* PPM Setup Modal */}
      {showPPMSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Player Profile Setup</h2>
              <p className="text-gray-600 mt-2">Configure your personal playing characteristics for accurate recommendations</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dominant Hand</label>
                  <select
                    value={tempPPM.dominantHand}
                    onChange={(e) => setTempPPM({ ...tempPPM, dominantHand: e.target.value as Hand })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="R">Right-handed</option>
                    <option value="L">Left-handed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handicap</label>
                  <input
                    type="number"
                    value={tempPPM.handicap}
                    onChange={(e) => setTempPPM({ ...tempPPM, handicap: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="36"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Normal Shot Shape</label>
                  <select
                    value={tempPPM.normalShot}
                    onChange={(e) => setTempPPM({ ...tempPPM, normalShot: e.target.value as NormalShot })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draw">Draw</option>
                    <option value="fade">Fade</option>
                    <option value="straight">Straight</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ball Flight</label>
                  <select
                    value={tempPPM.ballFlight}
                    onChange={(e) => setTempPPM({ ...tempPPM, ballFlight: e.target.value as BallFlight })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="mid">Mid</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Club Distances */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Club Distances (yards)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(Object.keys(tempPPM.clubs) as ClubId[]).map((club) => (
                    <div key={club} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">{club}</label>
                      <div className="space-y-1">
                        <input
                          type="number"
                          placeholder="Carry"
                          value={tempPPM.clubs[club].carry}
                          onChange={(e) => setTempPPM({
                            ...tempPPM,
                            clubs: {
                              ...tempPPM.clubs,
                              [club]: { ...tempPPM.clubs[club], carry: Number(e.target.value) }
                            }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Total"
                          value={tempPPM.clubs[club].total}
                          onChange={(e) => setTempPPM({
                            ...tempPPM,
                            clubs: {
                              ...tempPPM.clubs,
                              [club]: { ...tempPPM.clubs[club], total: Number(e.target.value) }
                            }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={handleSkipPPM}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip for Now
              </button>
              <button
                onClick={handleSavePPM}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Status */}
      {!ppm.isSetup && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Profile Not Configured</h3>
              <p className="text-yellow-700">Set up your player profile for more accurate recommendations</p>
            </div>
            <button
              onClick={() => {
                setTempPPM(ppm);
                setShowPPMSetup(true);
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Setup Profile
            </button>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      {ppm.isSetup && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-green-800">Player Profile</h3>
              <p className="text-green-700">
                {ppm.dominantHand === "R" ? "Right" : "Left"}-handed, {ppm.handicap} HCP, 
                {ppm.normalShot} shape, {ppm.ballFlight} ball flight
              </p>
            </div>
            <button
              onClick={() => {
                setTempPPM(ppm);
                setShowPPMSetup(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Distance Input */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Distance to Hole
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="600"
            />
            <span className="text-gray-600">yards</span>
          </div>
        </div>

        {/* Environment */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wind className="w-5 h-5" />
            Environment
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wind Speed (mph)</label>
              <input
                type="number"
                value={env.windSpeed}
                onChange={(e) => setEnv({ ...env, windSpeed: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wind Direction</label>
              <select
                value={env.windDir}
                onChange={(e) => setEnv({ ...env, windDir: e.target.value as Environment["windDir"] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="head">Headwind</option>
                <option value="tail">Tailwind</option>
                <option value="cross_left">Cross Left</option>
                <option value="cross_right">Cross Right</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
              <input
                type="number"
                value={env.temperatureF}
                onChange={(e) => setEnv({ ...env, temperatureF: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="20"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Elevation (ft)</label>
              <input
                type="number"
                value={env.elevationFt}
                onChange={(e) => setEnv({ ...env, elevationFt: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="-200"
                max="200"
              />
            </div>
          </div>
        </div>

        {/* Questionnaire */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Shot Context</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lie</label>
              <select
                value={q.lie}
                onChange={(e) => setQ({ ...q, lie: e.target.value as Lie })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tee">Tee</option>
                <option value="fairway">Fairway</option>
                <option value="light_rough">Light Rough</option>
                <option value="heavy_rough">Heavy Rough</option>
                <option value="sand">Sand</option>
                <option value="recovery">Recovery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pin Position</label>
              <select
                value={q.pinPos}
                onChange={(e) => setQ({ ...q, pinPos: e.target.value as PinPos })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="front">Front</option>
                <option value="middle">Middle</option>
                <option value="back">Back</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Risk (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={q.hazardRisk}
                onChange={(e) => setQ({ ...q, hazardRisk: Number(e.target.value) as Questionnaire["hazardRisk"] })}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">{q.hazardRisk}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confidence (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={q.confidence}
                onChange={(e) => setQ({ ...q, confidence: Number(e.target.value) as Questionnaire["confidence"] })}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">{q.confidence}</div>
            </div>
          </div>

          {/* Tee Strategy Inputs */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-3">Tee Strategy (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fairway Width at Driver (yds)</label>
                <input
                  type="number"
                  value={q.fairwayWidthAtDriverYds || ""}
                  onChange={(e) => setQ({ ...q, fairwayWidthAtDriverYds: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Side</label>
                <select
                  value={q.hazardSide || ""}
                  onChange={(e) => setQ({ ...q, hazardSide: e.target.value ? e.target.value as "left" | "right" : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Start (yds)</label>
                <input
                  type="number"
                  value={q.hazardStartYds || ""}
                  onChange={(e) => setQ({ ...q, hazardStartYds: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 250"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Clear (yds)</label>
                <input
                  type="number"
                  value={q.hazardClearYds || ""}
                  onChange={(e) => setQ({ ...q, hazardClearYds: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 265"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Club Adjustments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Club Adjustments</h2>
          <p className="text-sm text-gray-600 mb-4">Adjust key clubs for today's conditions</p>
          <div className="grid grid-cols-5 gap-4">
            {(["D", "7i", "PW", "GW", "SW"] as ClubId[]).map((club) => (
              <div key={club} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 text-center">{club}</label>
                <div className="space-y-1">
                  <input
                    type="number"
                    placeholder="Carry"
                    value={ppm.clubs[club].carry}
                    onChange={(e) => setPPM({
                      ...ppm,
                      clubs: {
                        ...ppm.clubs,
                        [club]: { ...ppm.clubs[club], carry: Number(e.target.value) }
                      }
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Total"
                    value={ppm.clubs[club].total}
                    onChange={(e) => setPPM({
                      ...ppm,
                      clubs: {
                        ...ppm.clubs,
                        [club]: { ...ppm.clubs[club], total: Number(e.target.value) }
                      }
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
          
          {best && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Primary: {best.club}</span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Carry: {Math.round(best.targetCarry)} yds</div>
                <div>Aim: {best.aimLateralYds === 0 ? "Center" : `${Math.abs(best.aimLateralYds)}y ${best.aimLateralYds > 0 ? "right" : "left"}`}</div>
                <div>Expected strokes: {best.expStrokes.toFixed(2)}</div>
                <div>Leave: {Math.round(best.leaveYds)} yds ({best.leaveLie})</div>
              </div>
              {best.reasons.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  {best.reasons.join("; ")}
                </div>
              )}
            </div>
          )}

          {backup && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Backup: {backup.club}</span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Carry: {Math.round(backup.targetCarry)} yds</div>
                <div>Aim: {backup.aimLateralYds === 0 ? "Center" : `${Math.abs(backup.aimLateralYds)}y ${backup.aimLateralYds > 0 ? "right" : "left"}`}</div>
                <div>Expected strokes: {backup.expStrokes.toFixed(2)}</div>
                <div>Leave: {Math.round(backup.leaveYds)} yds ({backup.leaveLie})</div>
              </div>
              {backup.reasons.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  {backup.reasons.join("; ")}
                </div>
              )}
            </div>
          )}

          {!best && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-800">No clear recommendation</span>
              </div>
              <div className="text-sm text-gray-600">
                Consider adjusting your approach or seeking course management advice.
              </div>
            </div>
          )}
        </div>

        {/* All Options */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">All Options</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {list.map((candidate, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded border text-sm">
                <div className="font-medium">{candidate.club}</div>
                <div className="text-gray-600">
                  Carry: {Math.round(candidate.targetCarry)}y, 
                  Strokes: {candidate.expStrokes.toFixed(2)}, 
                  Leave: {Math.round(candidate.leaveYds)}y
                </div>
                {candidate.reasons.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {candidate.reasons.join("; ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Self Tests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Self Tests</h3>
          <div className="space-y-2">
            {tests.map((test, i) => (
              <div key={i} className={`p-2 rounded text-sm ${test.pass ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <div className="flex items-center gap-2">
                  {test.pass ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="font-medium">{test.name}</span>
                </div>
                {!test.pass && <div className="mt-1 text-xs">{test.error}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default CaddyAIV2;