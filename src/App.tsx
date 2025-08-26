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
import { Target, Mic, MicOff, Volume2, Settings, User, Edit3, Save, X } from 'lucide-react';
import { useVoiceChat } from './hooks/useVoiceChat';

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