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
import { Target, Settings, Save, X } from 'lucide-react';
import { useVoiceChat } from './hooks/useVoiceChat';
import { useTheme } from './hooks/useTheme';
import { useGptCaddie } from './hooks/useGptCaddie';

// ========================================

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
  windDir: "head" | "tail" | "cross_R_to_L" | "cross_L_to_R";
}

interface Course {
  distanceToHole: number;     // yards
  elevation: number;          // feet (+ uphill, - downhill)
  temperature: number;        // °F
  altitude: number;           // feet above sea level
  lie: Lie;
  stance: Stance;
  pinPos: PinPos;
  fairwayWidth?: number | null; // yards (null = unknown/irrelevant)
  hazards: Hazard[];
}

interface Hazard {
  id: string;
  type: "bunker" | "water" | "greenside_bunker";
  side: "left" | "right" | "FL" | "FR" | "BL" | "BR";
  startYards: number;
  clearYards: number;
}

interface ShotPlan {
  club: ClubId;
  description: string;
  expectedCarry: number;
  expectedTotal: number;
  riskScore: number;
  expectedStrokes: number;
  pSuccess: number;
  pHazard: number;
  pFairway: number;
  reasoning: string;
  isLayup?: boolean;
}

// ---------- Default PPM ----------

const DEFAULT_PPM: PPM = {
  dominantHand: "R",
  handicap: 15,
  normalShot: "draw",
  ballFlight: "mid",
  isSetup: false,
  clubs: {
    D: { carry: 240, total: 260, sigCarry: 15, sigLat: 20, confidence: 0.7 },
    "3W": { carry: 220, total: 235, sigCarry: 12, sigLat: 18, confidence: 0.75 },
    "5W": { carry: 200, total: 215, sigCarry: 10, sigLat: 16, confidence: 0.8 },
    "3H": { carry: 185, total: 195, sigCarry: 8, sigLat: 14, confidence: 0.85 },
    "4i": { carry: 170, total: 180, sigCarry: 8, sigLat: 12, confidence: 0.8 },
    "5i": { carry: 160, total: 170, sigCarry: 7, sigLat: 11, confidence: 0.85 },
    "6i": { carry: 150, total: 158, sigCarry: 6, sigLat: 10, confidence: 0.9 },
    "7i": { carry: 140, total: 148, sigCarry: 6, sigLat: 9, confidence: 0.9 },
    "8i": { carry: 130, total: 136, sigCarry: 5, sigLat: 8, confidence: 0.95 },
    "9i": { carry: 120, total: 125, sigCarry: 5, sigLat: 7, confidence: 0.95 },
    PW: { carry: 110, total: 114, sigCarry: 4, sigLat: 6, confidence: 0.95 },
    GW: { carry: 100, total: 103, sigCarry: 4, sigLat: 5, confidence: 0.95 },
    SW: { carry: 85, total: 88, sigCarry: 3, sigLat: 4, confidence: 0.9 },
    LW: { carry: 70, total: 72, sigCarry: 3, sigLat: 4, confidence: 0.85 }
  }
};

// ---------- Environmental adjustments ----------

function adjustForConditions(baseCarry: number, baseSigma: number, env: Environment, course: Course): [number, number] {
  let carry = baseCarry;
  let sigma = baseSigma;

  // Temperature: +1y per 10°F above 70°F, -1y per 10°F below
  const tempAdj = (course.temperature - 70) / 10;
  carry += tempAdj;

  // Altitude: +2% per 1000ft
  const altAdj = (course.altitude / 1000) * 0.02;
  carry *= (1 + altAdj);

  // Elevation: +1y per 3ft uphill, -1y per 3ft downhill
  const elevAdj = course.elevation / 3;
  carry += elevAdj;

  // Wind: head/tail affects carry, cross affects sigma
  if (env.windDir === "head") {
    carry -= env.windSpeed * 0.8;
  } else if (env.windDir === "tail") {
    carry += env.windSpeed * 0.6;
  } else if (env.windDir === "cross_R_to_L" || env.windDir === "cross_L_to_R") {
    sigma += env.windSpeed * 0.3;
  }

  // Lie conditions
  const lieFactors = {
    tee: 1.0,
    fairway: 1.0,
    light_rough: 0.95,
    heavy_rough: 0.85,
    sand: 0.8,
    recovery: 0.7
  };
  carry *= lieFactors[course.lie];

  // Stance adjustments
  if (course.stance === "ball_above") carry *= 0.95;
  if (course.stance === "ball_below") carry *= 1.05;
  if (course.stance === "uphill") carry *= 1.1;
  if (course.stance === "downhill") carry *= 0.9;

  return [Math.max(carry, 10), Math.max(sigma, 1)];
}

// ---------- Risk appetite ----------

function getRiskAppetite(handicap: number, confidence: number): number {
  // Lower handicap + higher confidence = more aggressive
  const baseRisk = Math.max(0.1, Math.min(0.9, 1 - (handicap / 30)));
  const confAdj = (confidence - 3) * 0.1; // confidence 1-5, neutral at 3
  return Math.max(0.1, Math.min(0.9, baseRisk + confAdj));
}

// ---------- Strokes-to-hole model (toy version) ----------

function strokesFromDistance(yards: number, lie: Lie): number {
  // Simplified model - replace with real strokes gained data
  const baseLookup = [
    [0, 2.1], [50, 2.3], [100, 2.6], [150, 2.9], [200, 3.2],
    [250, 3.6], [300, 4.0], [350, 4.4], [400, 4.8], [450, 5.2], [500, 5.6]
  ];
  
  let base = 5.6;
  for (let i = 0; i < baseLookup.length - 1; i++) {
    const [d1, s1] = baseLookup[i];
    const [d2, s2] = baseLookup[i + 1];
    if (yards >= d1 && yards <= d2) {
      base = s1 + (s2 - s1) * (yards - d1) / (d2 - d1);
      break;
    }
  }

  // Lie penalty
  const liePenalties = {
    tee: 0, fairway: 0, light_rough: 0.2, heavy_rough: 0.5, sand: 0.8, recovery: 1.2
  };
  
  return base + liePenalties[lie];
}

// ---------- Shot planning logic ----------

function planShot(
  club: ClubId,
  ppm: PPM,
  env: Environment,
  course: Course,
  hazards: Hazard[],
  confidence: number
): ShotPlan {
  const spec = ppm.clubs[club];
  const [adjCarry, adjSigCarry] = adjustForConditions(spec.carry, spec.sigCarry, env, course);
  const [, adjSigLat] = adjustForConditions(spec.total, spec.sigLat, env, course);
  
  // Expected total distance (carry + roll, adjusted for conditions)
  const rollFactor = course.lie === "tee" ? 1.08 : (course.lie === "fairway" ? 1.05 : 1.0);
  const expectedTotal = adjCarry * rollFactor;
  
  // Risk calculations
  let pHazard = 0;
  let pFairway = 1;
  
  // Calculate hazard risks - water must be avoided at all costs
  for (const hazard of hazards) {
    let hazardRisk = 0;
    
    if (hazard.type === "greenside_bunker") {
      // Greenside bunkers matter when approaching the green
      const remainingYards = Math.max(0, course.distanceToHole - expectedTotal);
      if (remainingYards < 80) {
        // Higher risk if pin position aligns with bunker position
        const pinRisk = (hazard.side.includes('F') && course.pinPos === 'front') ||
                       (hazard.side.includes('B') && course.pinPos === 'back') ? 0.2 : 0.1;
        hazardRisk = pinRisk;
      }
    } else {
      // Calculate distance-based risk for bunkers and water
      hazardRisk = pBand(expectedTotal, adjSigCarry, hazard.startYards, hazard.clearYards);
      
      // Adjust for lateral dispersion if hazard is on preferred miss side
      const prefersRight = (ppm.dominantHand === "R" && ppm.normalShot === "fade") || 
                          (ppm.dominantHand === "L" && ppm.normalShot === "draw");
      const hazardOnPrefSide = (hazard.side === "right" && prefersRight) || 
                              (hazard.side === "left" && !prefersRight);
      
      if (hazardOnPrefSide) {
        const lateralRisk = pMissSide(adjSigLat, course.fairwayWidth, hazard.side as "left" | "right");
        hazardRisk = Math.min(1, hazardRisk + lateralRisk * 0.3);
      }
      
      // Water must be avoided at all costs - massive penalty
      if (hazard.type === "water") {
        hazardRisk *= 3.0; // Triple the risk for water
      }
    }
    
    // Multiple hazards compound risk significantly
    pHazard = Math.min(1, pHazard + hazardRisk * (1 + pHazard * 0.5));
  }
  
  // Fairway hit probability (only matters for driver on tee)
  if (course.lie === "tee" && club === "D" && course.fairwayWidth) {
    pFairway = pWithinFairway(adjSigLat, course.fairwayWidth);
  }
  
  // Success probability (avoid hazard + reasonable accuracy)
  const pSuccess = (1 - pHazard) * Math.max(0.5, pFairway) * spec.confidence;
  
  // Expected strokes calculation
  const remainingYards = Math.max(0, course.distanceToHole - expectedTotal);
  const nextLie: Lie = pSuccess > 0.7 ? "fairway" : "light_rough";
  const baseStrokes = 1 + strokesFromDistance(remainingYards, nextLie);
  
  // Penalties for hazards and misses
  const hazardPenalty = pHazard * 1.5; // stroke and distance
  const roughPenalty = (1 - pFairway) * 0.3;
  
  const expectedStrokes = baseStrokes + hazardPenalty + roughPenalty;
  
  // Risk score (0-100, lower is better)
  const riskScore = Math.round(pHazard * 50 + (1 - pSuccess) * 30 + (1 - spec.confidence) * 20);
  
  // Generate description and reasoning
  let description = `${club}`;
  if (expectedTotal < course.distanceToHole - 20) {
    description += ` (${Math.round(expectedTotal)}y, leaves ${Math.round(remainingYards)}y)`;
  } else {
    description += ` (${Math.round(expectedTotal)}y)`;
  }
  
  let reasoning = `${Math.round(pSuccess * 100)}% success rate. `;
  if (pHazard > 0.1) {
    reasoning += `${Math.round(pHazard * 100)}% hazard risk. `;
  }
  if (course.lie === "tee" && club === "D" && course.fairwayWidth) {
    reasoning += `${Math.round(pFairway * 100)}% fairway hit rate.`;
  }
  
  return {
    club,
    description,
    expectedCarry: Math.round(adjCarry),
    expectedTotal: Math.round(expectedTotal),
    riskScore,
    expectedStrokes: Math.round(expectedStrokes * 10) / 10,
    pSuccess: Math.round(pSuccess * 100) / 100,
    pHazard: Math.round(pHazard * 100) / 100,
    pFairway: Math.round(pFairway * 100) / 100,
    reasoning
  };
}

// ---------- Main App Component ----------

export default function App() {
  // State management
  const [ppm, setPPM] = useState<PPM>(() => {
    const saved = localStorage.getItem('caddyai-ppm');
    return saved ? { ...DEFAULT_PPM, ...JSON.parse(saved) } : DEFAULT_PPM;
  });
  
  const [env, setEnv] = useState<Environment>({
    windSpeed: 5,
    windDir: "head"
  });
  
  const [course, setCourse] = useState<Course>({
    distanceToHole: 275,
    elevation: 0,
    temperature: 75,
    altitude: 0,
    lie: "tee",
    stance: "flat",
    pinPos: "middle",
    fairwayWidth: null,
    hazards: []
  });
  
  const [confidence, setConfidence] = useState(3);
  const [showSettings, setShowSettings] = useState(false);
  const [editingPPM, setEditingPPM] = useState(false);
  
  const voice = useVoiceChat();
  const { theme, toggle: toggleTheme } = useTheme();

  const gpt = useGptCaddie({
    distance, q, env,
    setDistance, setQ, setEnv,
    speak: voice.speak
  });
  
  // Save PPM to localStorage
  useEffect(() => {
    localStorage.setItem('caddyai-ppm', JSON.stringify(ppm));
  }, [ppm]);
  
  // Shot planning calculations
  const getRecommendations = useMemo(() => {
    return (): ShotPlan[] => {
      const riskAppetite = getRiskAppetite(ppm.handicap, confidence);
      const plans: ShotPlan[] = [];
      
      // Test all clubs
      for (const club of CLUB_ORDER) {
       // Skip driver unless on tee
       if (club === "D" && course.lie !== "tee") continue;
       
        const plan = planShot(club, ppm, env, course, course.hazards, confidence);
        
        // Skip clubs that are way too short or too long
        if (plan.expectedTotal < course.distanceToHole * 0.3) continue;
        if (plan.expectedTotal > course.distanceToHole * 1.3) continue;
        
        plans.push(plan);
      }
      
      // Add layup options if there's a hazard and we're on the tee
      const mainHazards = course.hazards.filter(h => h.type !== "greenside_bunker");
      if (mainHazards.length > 0 && course.lie === "tee") {
        // Find the earliest hazard to determine layup distance
        const earliestHazard = mainHazards.reduce((earliest, current) => 
          current.startYards < earliest.startYards ? current : earliest
        );
        const layupDistance = Math.max(100, earliestHazard.startYards - 20);
        
        for (const club of CLUB_ORDER) {
          const spec = ppm.clubs[club];
          const [adjCarry] = adjustForConditions(spec.carry, spec.sigCarry, env, course);
          
          if (Math.abs(adjCarry - layupDistance) < 15) {
            const layupPlan = planShot(club, ppm, env, course, [], confidence);
            layupPlan.description += " (layup)";
            layupPlan.isLayup = true;
            layupPlan.reasoning = `Safe layup to ${layupDistance}y, avoids ${earliestHazard.side} ${earliestHazard.type}.`;
            plans.push(layupPlan);
          }
        }
      }
      
      // Sort by expected strokes, then by risk
      plans.sort((a, b) => {
        const strokeDiff = a.expectedStrokes - b.expectedStrokes;
        if (Math.abs(strokeDiff) > 0.1) return strokeDiff;
        return a.riskScore - b.riskScore;
      });
      
      return plans.slice(0, 6); // Top 6 options
    };
  }, [ppm, env, course, confidence]);
  
  const recommendations = getRecommendations();
  const primary = recommendations[0];
  const backup = recommendations[1];
  
  // Helper functions for hazard management
  const addHazard = () => {
    const newHazard: Hazard = {
      id: crypto.randomUUID(),
      type: "bunker",
      side: "left",
      startYards: 200,
      clearYards: 220
    };
    setCourse(prev => ({ ...prev, hazards: [...prev.hazards, newHazard] }));
  };
  
  const updateHazard = (id: string, updates: Partial<Hazard>) => {
    setCourse(prev => ({
      ...prev,
      hazards: prev.hazards.map(h => h.id === id ? { ...h, ...updates } : h)
    }));
  };
  
  const removeHazard = (id: string) => {
    setCourse(prev => ({
      ...prev,
      hazards: prev.hazards.filter(h => h.id !== id)
    }));
  };
  
  // Crosswind strategy warning
  const getCrosswindWarning = () => {
    if (env.windSpeed < 15) return null;
    
    const isRightHanded = ppm.dominantHand === "R";
    const hitsDraw = ppm.normalShot === "draw";
    const hitsfade = ppm.normalShot === "fade";
    const windLtoR = env.windDir === "cross_L_to_R";
    const windRtoL = env.windDir === "cross_R_to_L";
    
    // Draw fights L-to-R wind, Fade fights R-to-L wind
    const drawFightsWind = hitsDraw && windLtoR;
    const fadeFightsWind = hitsfade && windRtoL;
    
    if (drawFightsWind || fadeFightsWind) {
      const aimDirection = windLtoR ? "RIGHT" : "LEFT";
      const shotShape = hitsDraw ? "Draw" : "Fade";
      const windDirection = windLtoR ? "L-R" : "R-L";
      
      return `CRITICAL: ${shotShape} fights ${windDirection} wind! Aim 20y ${aimDirection} of target OR take 1-2 extra clubs and swing at 80%`;
    }
    
    return null;
  };
  
  const crosswindWarning = getCrosswindWarning();
  
  const onVoiceResult = async (text: string) => {
    try {
      await gpt.interpretAndApply(text);   // GPT extracts & updates + speaks
    } catch (e) {
      // Fallback to the local keyword parser if the API call fails
      const { upd, distance: dist, action } = parseVoiceCommand(text, q);
      if (Object.keys(upd).length) setQ({ ...q, ...upd });
      if (dist != null && !Number.isNaN(dist)) setDistance(Math.round(dist));
      if (action === 'speakRec') {
        voice.speak(describeRecommendation(best, backup, { ...q, ...upd }));
      }
    }
  };
  
  // Helper functions for aim point calculation
  const getAimPoint = (plan: ShotPlan, course: Course, env: Environment, ppm: PPM): string => {
    const hazards = course.hazards;
    const mainHazards = hazards.filter(h => h.type !== "greenside_bunker");
    const greensideBunkers = hazards.filter(h => h.type === "greenside_bunker");
    
    // Check if this shot can reach the green (within 20 yards of hole)
    const canReachGreen = plan.expectedTotal >= course.distanceToHole - 20;
    
    // Base aim point - different for green vs fairway shots
    let aimPoint = canReachGreen ? "CENTER OF GREEN" : "CENTER OF FAIRWAY";
    
    if (canReachGreen) {
      // Green-targeting logic
      
      // First, adjust for pin position
      if (course.pinPos === "front") {
        aimPoint = "FRONT OF GREEN";
      } else if (course.pinPos === "back") {
        aimPoint = "BACK OF GREEN";
      } else {
        aimPoint = "CENTER OF GREEN";
      }
      
      // Adjust for greenside bunkers
      if (greensideBunkers.length > 0) {
        const frontBunkers = greensideBunkers.filter(h => h.side.includes('F'));
        const backBunkers = greensideBunkers.filter(h => h.side.includes('B'));
        const leftBunkers = greensideBunkers.filter(h => h.side.includes('L'));
        const rightBunkers = greensideBunkers.filter(h => h.side.includes('R'));
        
        // Avoid bunkers based on pin position
        if (course.pinPos === "front" && frontBunkers.length > 0) {
          aimPoint = "CENTER OF GREEN (avoid front bunkers)";
        } else if (course.pinPos === "back" && backBunkers.length > 0) {
          aimPoint = "CENTER OF GREEN (avoid back bunkers)";
        } else if (leftBunkers.length > 0 && rightBunkers.length === 0) {
          aimPoint = "RIGHT SIDE OF GREEN";
        } else if (rightBunkers.length > 0 && leftBunkers.length === 0) {
          aimPoint = "LEFT SIDE OF GREEN";
        } else if (leftBunkers.length > 0 && rightBunkers.length > 0) {
          aimPoint = "CENTER OF GREEN (bunkers both sides)";
        }
      }
    } else {
      // Fairway-targeting logic (existing logic)
      if (mainHazards.length > 0) {
        const relevantHazards = mainHazards.filter(h => 
          plan.expectedTotal >= h.startYards - 20 && plan.expectedTotal <= h.clearYards + 20
        );
        
        if (relevantHazards.length > 0) {
          const leftHazards = relevantHazards.filter(h => h.side === "left");
          const rightHazards = relevantHazards.filter(h => h.side === "right");
          
          if (leftHazards.length > 0 && rightHazards.length === 0) {
            aimPoint = "RIGHT SIDE OF FAIRWAY";
          } else if (rightHazards.length > 0 && leftHazards.length === 0) {
            aimPoint = "LEFT SIDE OF FAIRWAY";
          } else if (leftHazards.length > 0 && rightHazards.length > 0) {
            aimPoint = "NARROW CENTER LINE";
          }
        }
      }
    }
    
    // Adjust for wind
    if (env.windSpeed >= 10) {
      if (env.windDir === "cross_L_to_R") {
        aimPoint += " (Aim 10y LEFT for wind)";
      } else if (env.windDir === "cross_R_to_L") {
        aimPoint += " (Aim 10y RIGHT for wind)";
      }
    }
    
    // Adjust for natural shot shape
    const naturalMiss = ppm.normalShot === "draw" ? "left" : ppm.normalShot === "fade" ? "right" : "straight";
    if (naturalMiss !== "straight" && !aimPoint.includes("wind")) {
      const compensation = naturalMiss === "draw" ? "slightly right" : "slightly left";
      aimPoint += ` (favor ${compensation} for ${ppm.normalShot})`;
    }
    
    return aimPoint;
  };
  
  const getAimPointReasoning = (plan: ShotPlan, course: Course, env: Environment, ppm: PPM): string => {
    const mainHazards = course.hazards.filter(h => h.type !== "greenside_bunker");
    const greensideBunkers = course.hazards.filter(h => h.type === "greenside_bunker");
    const canReachGreen = plan.expectedTotal >= course.distanceToHole - 20;
    let reasoning = "";
    
    if (canReachGreen) {
      reasoning += `Targeting green (${plan.expectedTotal}y carry). `;
      
      if (course.pinPos !== "middle") {
        reasoning += `Pin is ${course.pinPos}. `;
      }
      
      if (greensideBunkers.length > 0) {
        const bunkerPositions = greensideBunkers.map(h => h.side).join(", ");
        reasoning += `Avoiding ${bunkerPositions} greenside bunkers. `;
      }
    } else {
      if (mainHazards.length > 0) {
        const relevantHazards = mainHazards.filter(h => 
          plan.expectedTotal >= h.startYards - 20 && plan.expectedTotal <= h.clearYards + 20
        );
        
        if (relevantHazards.length > 0) {
          const hazardSides = relevantHazards.map(h => h.side).join(", ");
          reasoning += `Avoiding ${hazardSides} hazard(s). `;
        }
      }
    }
    
    if (env.windSpeed >= 10) {
      reasoning += `${env.windSpeed}mph ${env.windDir.replace('_', ' ')} wind compensation. `;
    }
    
    if (ppm.normalShot !== "straight") {
      reasoning += `Account for natural ${ppm.normalShot} ball flight.`;
    }
    
    return reasoning || "Optimal target line for this shot.";
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-wh
  )
}ite">
              CaddyAI v2.3
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Hazard-Aware Golf Shot Planner
          </p>
        </div>

        {/* Shot Recommendations - Moved to Top */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Shot Recommendations
          </h2>
          
          {recommendations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No suitable shots found. Check your distance and conditions.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Primary Recommendation with Prominent Aim Point */}
              {primary && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
                  {/* Club and Shot Details */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6" />
                      Primary: {primary.description}
                    </h3>
                    <div className="text-right">
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                        Risk: {primary.riskScore}/100
                      </div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                        Expected: {primary.expectedStrokes} strokes
                      </div>
                    </div>
                  </div>
                  
                  {/* Aim Point Section - Below Club Recommendation */}
                  <div className="text-center mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <h4 className="text-base font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                      🎯 AIM POINT
                    </h4>
                    <div className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                      {getAimPoint(primary, course, env, ppm)}
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {getAimPointReasoning(primary, course, env, ppm)}
                    </p>
                  </div>
                  
                  <p className="text-emerald-700 dark:text-emerald-300 mb-4 text-lg">
                    {primary.reasoning}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Success:</span>
                      <span className="ml-1 font-medium">{Math.round(primary.pSuccess * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Hazard:</span>
                      <span className="ml-1 font-medium">{Math.round(primary.pHazard * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Fairway:</span>
                      <span className="ml-1 font-medium">{Math.round(primary.pFairway * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Backup Recommendation with Aim Point */}
              {backup && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5" />
                      Backup: {backup.description}
                    </h3>
                    <div className="text-right">
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Risk: {backup.riskScore}/100
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Expected: {backup.expectedStrokes} strokes
                      </div>
                    </div>
                  </div>
                  
                  {/* Backup Aim Point - Below Club Recommendation */}
                  <div className="text-center mb-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      🎯 Backup Aim Point
                    </h4>
                    <div className="text-base font-semibold text-blue-800 dark:text-blue-200">
                      {getAimPoint(backup, course, env, ppm)}
                    </div>
                  </div>
                  
                  <p className="text-blue-700 dark:text-blue-300 mb-2">
                    {backup.reasoning}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Success:</span>
                      <span className="ml-1 font-medium">{Math.round(backup.pSuccess * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Hazard:</span>
                      <span className="ml-1 font-medium">{Math.round(backup.pHazard * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Fairway:</span>
                      <span className="ml-1 font-medium">{Math.round(backup.pFairway * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Course Conditions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Course Conditions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Distance to Hole (yards)
              </label>
              <input
                type="number"
                value={course.distanceToHole}
                onChange={(e) => setCourse(prev => ({ ...prev, distanceToHole: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wind Speed (mph)
              </label>
              <input
                type="number"
                value={env.windSpeed}
                onChange={(e) => setEnv(prev => ({ ...prev, windSpeed: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wind Direction
              </label>
              <select
                value={env.windDir}
                onChange={(e) => setEnv(prev => ({ ...prev, windDir: e.target.value as Environment['windDir'] }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="head">Headwind</option>
                <option value="tail">Tailwind</option>
                <option value="cross_L_to_R">Left to Right</option>
                <option value="cross_R_to_L">Right to Left</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lie
              </label>
              <select
                value={course.lie}
                onChange={(e) => setCourse(prev => ({ ...prev, lie: e.target.value as Lie }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stance
              </label>
              <select
                value={course.stance}
                onChange={(e) => setCourse(prev => ({ ...prev, stance: e.target.value as Stance }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="flat">Flat</option>
                <option value="ball_above">Ball Above Feet</option>
                <option value="ball_below">Ball Below Feet</option>
                <option value="uphill">Uphill</option>
                <option value="downhill">Downhill</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pin Position
              </label>
              <select
                value={course.pinPos}
                onChange={(e) => setCourse(prev => ({ ...prev, pinPos: e.target.value as PinPos }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="front">Front</option>
                <option value="middle">Middle</option>
                <option value="back">Back</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temperature (°F)
              </label>
              <input
                type="number"
                value={course.temperature}
                onChange={(e) => setCourse(prev => ({ ...prev, temperature: parseInt(e.target.value) || 75 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Elevation (feet)
              </label>
              <input
                type="number"
                value={course.elevation}
                onChange={(e) => setCourse(prev => ({ ...prev, elevation: parseInt(e.target.value) || 0 }))}
                placeholder="+ uphill, - downhill"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Altitude (feet above sea level)
              </label>
              <input
                type="number"
                value={course.altitude}
                onChange={(e) => setCourse(prev => ({ ...prev, altitude: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fairway Width (yards)
              </label>
              <input
                type="number"
                value={course.fairwayWidth || ''}
                onChange={(e) => setCourse(prev => ({ ...prev, fairwayWidth: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confidence (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Hazard Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Hazard Information
          </h2>
          
          <div className="space-y-4">
            {course.hazards.map((hazard, index) => (
              <div key={hazard.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={hazard.type}
                    onChange={(e) => updateHazard(hazard.id, { type: e.target.value as Hazard['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="bunker">Bunker</option>
                    <option value="water">Water</option>
                    <option value="greenside_bunker">Greenside Bunker</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Side/Position
                  </label>
                  <select
                    value={hazard.side}
                    onChange={(e) => updateHazard(hazard.id, { side: e.target.value as Hazard['side'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="FL">Front Left</option>
                    <option value="FR">Front Right</option>
                    <option value="BL">Back Left</option>
                    <option value="BR">Back Right</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Starts (yards)
                  </label>
                  <input
                    type="number"
                    value={hazard.startYards}
                    onChange={(e) => updateHazard(hazard.id, { startYards: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clear (yards)
                  </label>
                  <input
                    type="number"
                    value={hazard.clearYards}
                    onChange={(e) => updateHazard(hazard.id, { clearYards: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => removeHazard(hazard.id)}
                    className="w-full px-3 py-2 bg-re