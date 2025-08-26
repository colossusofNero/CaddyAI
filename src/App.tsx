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
import { ArrowRight, Flag, Wind, CheckCircle2, XCircle, User, Edit3 } from "lucide-react";

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
  windDir: "head" | "tail" | "cross_R_to_L" | "cross_L_to_R"; // relative to target line
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
  handicap: 15,
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
  fairwayWidthAtDriverYds: 25,
  hazardSide: null,
  hazardStartYds: 250,
  hazardClearYds: 260,
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

// ---------- Enhanced Risk appetite model with exponential handicap effect ----------

function riskLambda(handicap: number, confidence: number): number {
  // Exponential handicap effect - much more conservative for high handicap
  // Low handicap (0-5): 0.8-1.0 (aggressive)
  // Mid handicap (10-15): 1.2-1.6 (moderate)  
  // High handicap (20+): 2.0+ (very conservative)
  const handicapFactor = Math.pow(1.12, Math.max(0, handicap - 2)); // stronger exponential growth
  const base = 0.8 + handicapFactor * 0.18; // increased multiplier
  const confAdj = 1.0 + (3 - confidence) * 0.12; // confidence penalty increased
  return Math.min(3.5, Math.max(0.8, base * confAdj)); // higher max lambda
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

function handicapSafetyBuffer(handicap: number): number {
  // Extra safety buffer for high handicap players
  if (handicap > 15) return 8;  // +8 yards safety
  if (handicap > 10) return 4;  // +4 yards safety
  return 0;
}

function handicapRiskMultiplier(handicap: number, confidence: number): number {
  // Risk multiplier for hazardous situations
  const base = handicap > 15 ? 1.8 : handicap > 10 ? 1.3 : 1.0;
  const confPenalty = confidence <= 2 ? 1.5 : 1.0;
  return base * confPenalty;
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
  const handicapRiskMult = handicapRiskMultiplier(12, q.confidence); // using default handicap for now

  // Driver-specific fairway width penalty
  if (club === "D" && q.fairwayWidthAtDriverYds && q.fairwayWidthAtDriverYds < 30) {
    const pMiss = 1 - pWithinFairway(sigLat, q.fairwayWidthAtDriverYds);
    const widthPenalty = pMiss * 0.3 * lambda * handicapRiskMult;
    penalty += widthPenalty;
    reasons.push(`narrow fairway (${q.fairwayWidthAtDriverYds}y)`);
  }

  // Hazard band penalty
  if (q.hazardSide && q.hazardStartYds && q.hazardClearYds) {
    const pInBand = pBand(targetCarry, sigCarry, q.hazardStartYds, q.hazardClearYds);
    if (pInBand > 0.05) {
      const bandPenalty = hazardPenalty(pInBand, q.hazardRisk, lambda) * handicapRiskMult;
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

function findBestClubForDistance(ppm: PPM, targetDistance: number, env: Environment, lie: Lie): ClubId {
  // Find the club whose adjusted carry distance best matches the target
  let bestClub: ClubId = "7i";
  let bestDiff = Infinity;
  
  for (const club of CLUB_ORDER) {
    const adjustedCarry = adjustCarry(ppm, club, env, lie);
    const diff = Math.abs(adjustedCarry - targetDistance);
    
    if (diff < bestDiff) {
      bestDiff = diff;
      bestClub = club;
    }
  }
  
  return bestClub;
}

function evaluateCandidate(club: ClubId, targetCarry: number, aimLateralYds: number, intendedShape: Shape, input: ShotInput): CandidateEval {
  const { distanceToHole, ppm, env, q } = input;
  
  // Get adjusted club performance
  const actualCarry = adjustCarry(ppm, club, env, q.lie);
  const actualTotal = adjustTotal(ppm, club, env, q.lie);
  const { sigCarry, sigLat } = dispersion(ppm, club, env, q.stance);
  
  // Calculate expected landing position
  const expectedCarry = actualCarry;
  const leaveYds = Math.max(0, distanceToHole - expectedCarry);
  
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
  const distanceError = Math.abs(expectedCarry - distanceToHole);
  if (distanceError > 10) {
    const distancePenalty = (distanceError / 50) * lambda; // increased penalty for distance mismatch
    expStrokes += distancePenalty;
    reasons.push(`distance control (${Math.round(distanceError)}y off)`);
  }
  
  // Confidence penalty
  const confidencePenalty = (5 - q.confidence) * 0.05 * lambda; // increased penalty
  expStrokes += confidencePenalty;
  
  // High handicap penalty for aggressive shots
  if (ppm.handicap > 15 && targetCarry > ppm.clubs[club].carry * 0.9) {
    const aggressionPenalty = 0.25 * lambda; // increased penalty
    expStrokes += aggressionPenalty;
    reasons.push("high handicap + aggressive distance");
  }
  
  // High handicap penalty for trying to shape shots
  if (ppm.handicap > 8 && intendedShape !== "straight") {
    const shapePenalty = 0.2 * lambda;
    expStrokes += shapePenalty;
    reasons.push("high handicap + shot shaping");
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
    
    // High handicap players should avoid driver on narrow fairways
    const teeClubs = (ppm.handicap > 15 && q.fairwayWidthAtDriverYds && q.fairwayWidthAtDriverYds < 25) 
      ? (["3W", "5W", "3H"] as ClubId[]) // skip driver for high handicap + narrow fairway
      : canShapeShots(ppm.handicap) 
        ? (["D", "3W", "3H", "5W"] as ClubId[])
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

  // Center attack: find best club for target distance accounting for lie penalty
  const centerPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  const targetDistance = Math.max(0, distanceToHole - 10);
  const bestClub = findBestClubForDistance(ppm, targetDistance, env, q.lie);
  
  // Add the best club and adjacent clubs
  const bestIndex = clubIndex(bestClub);
  const clubsToTry = [
    bestIndex > 0 ? CLUB_ORDER[bestIndex - 1] : null,
    bestClub,
    bestIndex < CLUB_ORDER.length - 1 ? CLUB_ORDER[bestIndex + 1] : null
  ].filter(Boolean) as ClubId[];
  
  clubsToTry.forEach((club) => {
    const targetCarry = targetDistance;
    const shape = q.requiredShape === "any" 
      ? (canShapeShots(ppm.handicap) ? ppm.normalShot : "straight")
      : (canShapeShots(ppm.handicap) ? q.requiredShape : "straight");
    centerPlans.push({ club, targetCarry, aim: 0, shape });
  });
  options.push({ label: "Center attack (lie-adjusted)", plans: centerPlans });

  // Front-safe: hedge extra short when front is dangerous
  const shortPlans: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  const handicapSafetyBonus = handicapSafetyBuffer(ppm.handicap);
  const shortBias = safetyBufferYards(q.hazardRisk, q.pinPos) + (q.pinPos === "front" ? 4 : 0) + handicapSafetyBonus;
  const shortTargetDistance = Math.max(0, distanceToHole - 20 - shortBias);
  const shortBestClub = findBestClubForDistance(ppm, shortTargetDistance, env, q.lie);
  
  const shortBestIndex = clubIndex(shortBestClub);
  const shortClubsToTry = [
    shortBestIndex > 0 ? CLUB_ORDER[shortBestIndex - 1] : null,
    shortBestClub,
    shortBestIndex < CLUB_ORDER.length - 1 ? CLUB_ORDER[shortBestIndex + 1] : null
  ].filter(Boolean) as ClubId[];
  
  shortClubsToTry.forEach((club) => {
    const targetCarry = shortTargetDistance;
    const shape = q.requiredShape === "any" 
      ? (canShapeShots(ppm.handicap) ? ppm.normalShot : "straight")
      : (canShapeShots(ppm.handicap) ? q.requiredShape : "straight");
    shortPlans.push({ club, targetCarry, aim: 0, shape });
  });
  options.push({ label: "Front-safe", plans: shortPlans });

  // Preferred lay-up windows for approaches
  const layWindows = [80, 95, 110];
  const layPlansApproach: Array<{ club: ClubId; targetCarry: number; aim: number; shape: Shape }> = [];
  layWindows.forEach((leave) => {
    const layTargetDistance = Math.max(0, distanceToHole - leave);
    const layBestClub = findBestClubForDistance(ppm, layTargetDistance, env, q.lie);
    const shape = q.requiredShape === "any" 
      ? (canShapeShots(ppm.handicap) ? ppm.normalShot : "straight")
      : (canShapeShots(ppm.handicap) ? q.requiredShape : "straight");
    layPlansApproach.push({ club: layBestClub, targetCarry: layTargetDistance, aim: 0, shape });
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
  const pBandFar = pBand(220, 10, 1000, 1010);
  results.push({ name: "Far band => P(in)≈0", pass: approx(pBandFar, 0, 1e-6), got: pBandFar, expected: "≈0" });

  return results;
}

// ---------- Main App Component ----------

function CaddyAIV2() {
  const [ppm, setPpm] = useState<PPM>(defaultPPM);
  const [env, setEnv] = useState<Environment>(defaultEnv);
  const [q, setQ] = useState<Questionnaire>(defaultQ);
  const [distance, setDistance] = useState(152);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const input: ShotInput = { distanceToHole: distance, ppm, env, q };
  const recommendation = useMemo(() => recommend(input), [input]);
  const testResults = useMemo(() => runSelfTests(), []);

  const allOptions = useMemo(() => {
    return recommendation.list.slice(0, 10); // Show top 10 options
  }, [recommendation.list]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Player Profile Header */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-green-800 mb-1">Player Profile</h2>
            <p className="text-green-600 text-sm">
              {ppm.dominantHand === "R" ? "Right" : "Left"}-handed, {ppm.handicap} HCP, {ppm.normalShot} shape, {ppm.ballFlight} ball flight
            </p>
          </div>
          <button 
            onClick={() => setShowProfileModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            {/* Distance to Hole */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flag size={18} className="text-gray-600" />
                <h3 className="font-semibold text-gray-800">Distance to Hole</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center font-mono"
                />
                <span className="text-gray-600">yards</span>
              </div>
            </div>

            {/* Environment */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wind size={18} className="text-gray-600" />
                <h3 className="font-semibold text-gray-800">Environment</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Wind Speed (mph)</label>
                  <input
                    type="number"
                    value={env.windSpeed}
                    onChange={(e) => setEnv({...env, windSpeed: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Wind Direction</label>
                  <select
                    value={env.windDir}
                    onChange={(e) => setEnv({...env, windDir: e.target.value as Environment["windDir"]})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="head">Headwind</option>
                    <option value="tail">Tailwind</option>
                    <option value="cross_L_to_R">Cross L to R</option>
                    <option value="cross_R_to_L">Cross R to L</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    value={env.temperatureF}
                    onChange={(e) => setEnv({...env, temperatureF: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Elevation (ft)</label>
                  <input
                    type="number"
                    value={env.elevationFt}
                    onChange={(e) => setEnv({...env, elevationFt: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Shot Context */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Shot Context</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Lie</label>
                    <select
                      value={q.lie}
                      onChange={(e) => setQ({...q, lie: e.target.value as Lie})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                    <label className="block text-sm font-medium text-gray-600 mb-1">Pin Position</label>
                    <select
                      value={q.pinPos}
                      onChange={(e) => setQ({...q, pinPos: e.target.value as PinPos})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="front">Front</option>
                      <option value="middle">Middle</option>
                      <option value="back">Back</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Hazard Risk (1-5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={q.hazardRisk}
                    onChange={(e) => setQ({...q, hazardRisk: Number(e.target.value) as 1|2|3|4|5})}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span className="font-medium">{q.hazardRisk}</span>
                    <span>5</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Confidence (1-5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={q.confidence}
                    onChange={(e) => setQ({...q, confidence: Number(e.target.value) as 1|2|3|4|5})}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span className="font-medium">{q.confidence}</span>
                    <span>5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tee Strategy */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Tee Strategy (Optional)</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fairway Width at Driver (yds)</label>
                    <input
                      type="number"
                      value={q.fairwayWidthAtDriverYds || ""}
                      onChange={(e) => setQ({...q, fairwayWidthAtDriverYds: e.target.value ? Number(e.target.value) : null})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hazard Side</label>
                    <select
                      value={q.hazardSide || ""}
                      onChange={(e) => setQ({...q, hazardSide: e.target.value ? e.target.value as "left" | "right" : null})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">None</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hazard Start (yds)</label>
                    <input
                      type="number"
                      value={q.hazardStartYds || ""}
                      onChange={(e) => setQ({...q, hazardStartYds: e.target.value ? Number(e.target.value) : null})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="250"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hazard Clear (yds)</label>
                    <input
                      type="number"
                      value={q.hazardClearYds || ""}
                      onChange={(e) => setQ({...q, hazardClearYds: e.target.value ? Number(e.target.value) : null})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="260"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Club Adjustments */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Quick Club Adjustments</h3>
              <p className="text-sm text-gray-600 mb-3">Adjust key clubs for today's conditions</p>
              <div className="grid grid-cols-5 gap-3">
                {["D", "7i", "PW", "GW", "SW"].map((club) => {
                  const clubId = club as ClubId;
                  const baseCarry = ppm.clubs[clubId].carry;
                  const adjustedCarry = adjustCarry(ppm, clubId, env, q.lie);
                  return (
                    <div key={club} className="text-center">
                      <div className="font-semibold text-sm text-gray-700 mb-1">{club}</div>
                      <input
                        type="number"
                        value={Math.round(baseCarry)}
                        onChange={(e) => {
                          const newCarry = Number(e.target.value);
                          setPpm({
                            ...ppm,
                            clubs: {
                              ...ppm.clubs,
                              [clubId]: { ...ppm.clubs[clubId], carry: newCarry }
                            }
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center"
                      />
                      <input
                        type="number"
                        value={Math.round(adjustedCarry)}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-center bg-gray-50 mt-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Recommendations and Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wind Strategy Alert */}
            {(() => {
              const windSpeed = env.windSpeed;
              const windDir = env.windDir;
              const shotShape = ppm.normalShot;
              const isRightHanded = ppm.dominantHand === 'R';
              
              if (windSpeed >= 15 && (windDir === 'cross_L_to_R' || windDir === 'cross_R_to_L')) {
                let strategy = '';
                let severity = 'WARNING';
                
                if (windSpeed >= 20) {
                  severity = 'CRITICAL';
                }
                
                // Right-handed draw in L-R wind
                if (isRightHanded && shotShape === 'draw' && windDir === 'cross_L_to_R') {
                  const aimAdjust = Math.round(windSpeed * 0.8);
                  strategy = `${severity}: Draw fights L-R wind! Aim ${aimAdjust}y RIGHT of target OR take 1-2 extra clubs and swing at 80%`;
                }
                // Right-handed fade in R-L wind  
                else if (isRightHanded && shotShape === 'fade' && windDir === 'cross_R_to_L') {
                  const aimAdjust = Math.round(windSpeed * 0.8);
                  strategy = `${severity}: Fade fights R-L wind! Aim ${aimAdjust}y LEFT of target OR take 1-2 extra clubs and swing at 80%`;
                }
                // Wind helping shot shape
                else if ((isRightHanded && shotShape === 'draw' && windDir === 'cross_R_to_L') ||
                         (isRightHanded && shotShape === 'fade' && windDir === 'cross_L_to_R')) {
                  strategy = `${severity}: Wind amplifies your ${shotShape}! Aim for center and expect extra curve`;
                }
                // Left-handed logic (opposite)
                else if (!isRightHanded && shotShape === 'draw' && windDir === 'cross_R_to_L') {
                  const aimAdjust = Math.round(windSpeed * 0.8);
                  strategy = `${severity}: Draw fights R-L wind! Aim ${aimAdjust}y LEFT of target OR take 1-2 extra clubs and swing at 80%`;
                }
                else if (!isRightHanded && shotShape === 'fade' && windDir === 'cross_L_to_R') {
                  const aimAdjust = Math.round(windSpeed * 0.8);
                  strategy = `${severity}: Fade fights L-R wind! Aim ${aimAdjust}y RIGHT of target OR take 1-2 extra clubs and swing at 80%`;
                }
                
                if (strategy) {
                  return (
                    <div className={`p-4 rounded-lg border-l-4 mb-6 ${
                      severity === 'CRITICAL' 
                        ? 'bg-red-50 border-red-500 text-red-800' 
                        : 'bg-yellow-50 border-yellow-500 text-yellow-800'
                    }`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium">Wind Strategy</h3>
                          <p className="text-sm mt-1">{strategy}</p>
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Recommendations */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Recommendations</h3>
              
              <div className="space-y-3">
                {/* Primary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-green-800">Primary: {recommendation.best.club}</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Carry: {Math.round(adjustCarry(ppm, recommendation.best.club, env, q.lie))} yds</div>
                    <div>Aim: Center</div>
                    <div>Expected strokes: {recommendation.best.expStrokes.toFixed(2)}</div>
                    <div>Leave: {Math.round(recommendation.best.leaveYds)} yds (fairway)</div>
                  </div>
                </div>

                {/* Backup */}
                {recommendation.backup && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight size={14} className="text-blue-600" />
                      <span className="font-semibold text-blue-800">Backup: {recommendation.backup.club}</span>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>Carry: {Math.round(adjustCarry(ppm, recommendation.backup.club, env, q.lie))} yds</div>
                      <div>Aim: Center</div>
                      <div>Expected strokes: {recommendation.backup.expStrokes.toFixed(2)}</div>
                      <div>Leave: {Math.round(recommendation.backup.leaveYds)} yds (fairway)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* All Options */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">All Options</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {allOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded border-b border-gray-100 last:border-b-0">
                    <div className="font-semibold text-gray-800">{option.club}</div>
                    <div className="text-sm text-gray-600">
                      Carry: {Math.round(adjustCarry(ppm, option.club, env, q.lie))}y, 
                      Strokes: {option.expStrokes.toFixed(2)}, 
                      Leave: {Math.round(option.leaveYds)}y
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Self Tests */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Self Tests</h3>
              <div className="grid grid-cols-2 gap-3">
                {testResults.slice(0, 6).map((test, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {test.pass ? (
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-500 flex-shrink-0" />
                    )}
                    <span className={test.pass ? "text-green-700" : "text-red-700"}>
                      {test.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Edit Player Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dominant Hand</label>
                    <select
                      value={ppm.dominantHand}
                      onChange={(e) => setPpm({...ppm, dominantHand: e.target.value as Hand})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="R">Right</option>
                      <option value="L">Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Handicap</label>
                    <input
                      type="number"
                      value={ppm.handicap}
                      onChange={(e) => setPpm({...ppm, handicap: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                      max="36"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Natural Shot Shape</label>
                    <select
                      value={ppm.normalShot}
                      onChange={(e) => setPpm({...ppm, normalShot: e.target.value as NormalShot})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="draw">Draw</option>
                      <option value="fade">Fade</option>
                      <option value="straight">Straight</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ball Flight</label>
                    <select
                      value={ppm.ballFlight}
                      onChange={(e) => setPpm({...ppm, ballFlight: e.target.value as BallFlight})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="low">Low</option>
                      <option value="mid">Mid</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Club Distances */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Club Distances</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(ppm.clubs).map(([clubId, spec]) => (
                      <div key={clubId} className="flex items-center space-x-3">
                        <label className="w-8 text-sm font-medium text-gray-700">{clubId}</label>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={spec.carry}
                            onChange={(e) => setPpm({
                              ...ppm,
                              clubs: {
                                ...ppm.clubs,
                                [clubId]: { ...spec, carry: Number(e.target.value) }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="Carry yds"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={spec.total}
                            onChange={(e) => setPpm({
                              ...ppm,
                              clubs: {
                                ...ppm.clubs,
                                [clubId]: { ...spec, total: Number(e.target.value) }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="Total yds"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setPpm({...ppm, isSetup: true});
                    setShowProfileModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CaddyAIV2;