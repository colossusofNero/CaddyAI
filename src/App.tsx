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
  // Higher lambda => more conservative (exponential handicap effect)
  // Low handicap (0-5): 0.8-1.0 (aggressive)
  // Mid handicap (10-15): 1.2-1.6 (moderate)  
  // High handicap (20+): 2.0+ (very conservative)
  const handicapFactor = Math.pow(1.08, Math.max(0, handicap - 2)); // exponential growth
  const base = 0.8 + handicapFactor * 0.15;
  const confAdj = 1.0 + (3 - confidence) * 0.08; // confidence still matters
  return Math.min(3.0, Math.max(0.8, base * confAdj));
}

function canShapeShots(handicap: number): boolean {
  // Only low handicap players can reliably shape shots
  return handicap <= 8;
}

function shotShapeReliability(handicap: number): number {
  // How reliably can player execute intended shot shape (0-1)
  if (handicap <= 5) return 0.9;   // scratch players very reliable
  if (handicap <= 10) return 0.7;  // single digit decent
  if (handicap <= 15) return 0.4;  // mid handicap inconsistent
  return 0.1; // high handicap rarely shapes shots successfully
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

  // High handicap players get extra penalty for risky shots
  const handicapRiskMultiplier = q.confidence <= 2 ? 1.5 : 1.0;

  // Driver-specific fairway width penalty
  if (club === "D" && q.fairwayWidthAtDriverYds && q.fairwayWidthAtDriverYds < 30) {
    const pMiss = 1 - pWithinFairway(sigLat, q.fairwayWidthAtDriverYds);
    const widthPenalty = pMiss * 0.3 * lambda * handicapRiskMultiplier;
    penalty += widthPenalty;
    reasons.push(`narrow fairway (${q.fairwayWidthAtDriverYds}y)`);
  }

  // Hazard band penalty
  if (q.hazardSide && q.hazardStartYds && q.hazardClearYds) {
    const pInBand = pBand(targetCarry, sigCarry, q.hazardStartYds, q.hazardClearYds);
    if (pInBand > 0.05) {
      const bandPenalty = hazardPenalty(pInBand, q.hazardRisk, lambda) * handicapRiskMultiplier;
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
  const confidencePenalty = (5 - q.confidence) * 0.03 * lambda;
  expStrokes += confidencePenalty;
  
  // High handicap penalty for aggressive shots
  if (ppm.handicap > 15 && targetCarry > ppm.clubs[club].carry * 0.9) {
    const aggressionPenalty = 0.15 * lambda;
    expStrokes += aggressionPenalty;
    reasons.push("high handicap + aggressive distance");
  }
  
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
    
    const teeClubs = canShapeShots(ppm.handicap) 
      ? (["D", "3W", "3H", "5W"] as ClubId[])
      : (q.fairwayWidthAtDriverYds && q.fairwayWidthAtDriverYds < 25) 
        ? (["3W", "5W", "3H"] as ClubId[]) // skip driver for high handicap + narrow fairway
        : (["D", "3W", "3H", "5W"] as ClubId[]);
        
    teeClubs.forEach((club) => {
      const targetCarry = Math.max(0, adjustCarry(ppm, club, env, q.lie));
      const aim = q.hazardSide === "right" ? -5 : q.hazardSide === "left" ? 5 : 0;
      
      // High handicap players can't reliably shape shots
      const shape = q.requiredShape === "any" 
        ? (canShapeShots(ppm.handicap) ? ppm.normalShot : "straight")
        : (canShapeShots(ppm.handicap) ? q.requiredShape : "straight");
        
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
    const shape = q.requiredShape === "any" 
      ? (canShapeShots(ppm.handicap) ? ppm.normalShot : "straight")
      : (canShapeShots(ppm.handicap) ? q.requiredShape : "straight");
    centerPlans.push({ club, targetCarry, aim: 0, shape });
  });
  options.push({ label: "Center attack (filtered)", plans: centerPlans });

  // Front-safe: hedge extra short when front is dangerous
  const shortPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  // High handicap players need much larger safety buffers
  const handicapSafetyBonus = ppm.handicap > 15 ? 8 : ppm.handicap > 10 ? 4 : 0;
  const shortBias = safetyBufferYards(q.hazardRisk, q.pinPos) + (q.pinPos === "front" ? 4 : 0) + handicapSafetyBonus;
  (Object.keys(ppm.clubs) as ClubId[]).forEach((club) => {
    const targetCarry = Math.max(0, distanceToHole - 20 - shortBias);
    const shape = q.requiredShape === "any" 
      ? (canShapeShots(ppm.handicap) ? ppm.normalShot : "straight")
      : (canShapeShots(ppm.handicap) ? q.requiredShape : "straight");
    shortPlans.push({ club, targetCarry, aim: 0, shape });
  });
  options.push({ label: "Front-safe", plans: shortPlans });

  // Preferred lay-up windows for approaches
  const layWindows = [80, 95, 110];
  const layPlansApproach: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  (Object.keys(ppm.clubs) as ClubId[]).forEach((club) => {
    layWindows.forEach((leave) => {
      const targetCarry = Math.max(0, distanceToHole - leave);
      const shape = q.requiredShape === "any" 
        ? (canShapeShots(ppm.handicap) ? ppm.normalShot : "straight")
        : (canShapeShots(ppm.handicap) ? q.requiredShape : "straight");
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

type TestResult = { name: string; pass: boolean; got?: number | string; expected?: string; error?: string };

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
  const pBandFar = pBand(220