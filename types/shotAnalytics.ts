/**
 * Shot-to-Shot Analytics Types
 *
 * Types for the analytics system that passively captures data during play
 * and retroactively infers shot-by-shot records when scores are saved.
 */

import type { Timestamp } from 'firebase/firestore';

// ─── Raw event types (written live during play) ───────────────────────────────

export interface GPSCoord {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface OptimizerRunEvent {
  eventType: 'optimizer_run';
  eventId: string;
  roundId: string;
  userId: string;
  holeNumber: number;
  timestamp: Timestamp;

  // Conditions
  gpsPosition: GPSCoord;
  distanceToPin: number;
  lie: string;
  stance: string;
  elevation: number;
  windSpeed: number;
  windDirection: string;
  confidence: number;
  pinLocation?: string;
  pinSide?: string;

  // Primary recommendation
  primaryClub: string;
  primaryExpectedCarry: number;
  primaryTotalDistance: number;
  primaryConfidenceScore: number;

  // Secondary recommendation
  secondaryClub: string;
  secondaryExpectedCarry: number;
  secondaryTotalDistance: number;
  secondaryConfidenceScore: number;
}

export interface AIClubSelectionEvent {
  eventType: 'ai_club_selection';
  eventId: string;
  roundId: string;
  userId: string;
  holeNumber: number;
  timestamp: Timestamp;
  selectedClub: string;
}

export type RoundAnalyticsEvent = OptimizerRunEvent | AIClubSelectionEvent;

// ─── Inferred shot record (written on hole score save) ────────────────────────

export type RecommendationCompliance =
  | 'followed_primary'
  | 'followed_secondary'
  | 'overrode'
  | 'no_recommendation'
  | 'unknown';

export type ShotType = 'tee' | 'approach' | 'chip' | 'recovery' | 'unknown';

export type ShotLandingArea =
  | 'green'
  | 'fairway'
  | 'rough'
  | 'bunker'
  | 'water'
  | 'ob'
  | 'unknown';

export interface InferredShot {
  shotId: string;
  roundId: string;
  userId: string;
  holeNumber: number;
  shotNumber: number;
  timestamp: Timestamp;

  clubUsed: string;
  shotType: ShotType;

  // GPS
  positionFrom?: GPSCoord;
  positionTo?: GPSCoord;
  actualDistanceTraveled?: number; // yards

  // vs recommendation
  recommendedPrimaryClub?: string;
  recommendedSecondaryClub?: string;
  recommendationCompliance: RecommendationCompliance;

  // Carry accuracy
  expectedCarryYards?: number;
  carryDeltaYards?: number; // actual − expected (negative = short)

  // Outcome
  landingArea: ShotLandingArea;
  landedOnGreen: boolean;
  landedInFairway: boolean;
  distanceToPinAfterShot?: number;
}

// ─── Per-hole summary (written on hole score save) ────────────────────────────

export interface HoleAnalytics {
  docId: string; // "{roundId}_hole{N}"
  roundId: string;
  userId: string;
  holeNumber: number;
  par: number;
  score: number;
  scoreRelativeToPar: number;

  fairwayInRegulation: boolean | null;
  greenInRegulation: boolean;
  putts: number;
  penaltyStrokes: number;

  shotsBeforePutting: number;
  untrackedShots: number; // chip / recovery shots with no optimizer run

  complianceRate: number; // 0–1, fraction of tracked shots that followed primary
  shots: InferredShot[];

  timestamp: Timestamp;
}

// ─── Aggregated club stats (updated on round end) ─────────────────────────────

export interface ClubAnalytics {
  docId: string; // "{userId}_{ClubName}"
  userId: string;
  clubName: string;

  totalShots: number;
  roundsPlayed: number;

  averageCarryYards: number;
  carryStdDevYards: number;

  // vs optimizer predictions
  averageCarryDeltaYards: number; // actual − predicted, negative = short
  optimizerAccuracy: number; // 0–1 (1 = perfect prediction)

  greenHitRate: number; // 0–1 when used as approach
  fairwayHitRate: number; // 0–1 when used off tee

  // Score impact of compliance
  outcomeWhenFollowedAI: number; // avg score rel to par on holes using this club + followed
  outcomeWhenOverrodeAI: number;
  followedCount: number;
  overrodeCount: number;

  lastUpdated: Timestamp;
}

// ─── Round-level summary (written on round end) ───────────────────────────────

export interface RoundSummary {
  roundId: string;
  userId: string;
  courseId?: string;
  courseName?: string;
  date: string; // YYYY-MM-DD

  totalScore: number;
  totalPar: number;
  scoreRelativeToPar: number;

  holesPlayed: number;
  fairwaysHit: number;
  fairwayOpportunities: number;
  greensInRegulation: number;
  totalPutts: number;

  // AI compliance
  totalTrackedShots: number;
  followedPrimaryCount: number;
  followedSecondaryCount: number;
  overrodeCount: number;
  overallComplianceRate: number;

  // Score impact
  scoreWhenFollowedAI: number;
  scoreWhenOverrodeAI: number;

  timestamp: Timestamp;
}

// ─── Input shapes for recording ───────────────────────────────────────────────

export interface RecordOptimizerRunInput {
  gpsPosition: GPSCoord;
  holeNumber: number;
  distanceToPin: number;
  lie: string;
  stance: string;
  elevation: number;
  windSpeed: number;
  windDirection: string;
  confidence: number;
  pinLocation?: string;
  pinSide?: string;
  primaryClub: string;
  primaryExpectedCarry: number;
  primaryTotalDistance: number;
  primaryConfidenceScore: number;
  secondaryClub: string;
  secondaryExpectedCarry: number;
  secondaryTotalDistance: number;
  secondaryConfidenceScore: number;
}

export interface RecordHoleScoreInput {
  holeNumber: number;
  par: number;
  score: number;
  fairwayInRegulation: boolean | null;
  greenInRegulation: boolean;
  putts: number;
  penaltyStrokes: number;
}

export interface EndRoundInput {
  courseId?: string;
  courseName?: string;
  date: string; // YYYY-MM-DD
}

// ─── Hook / store state ───────────────────────────────────────────────────────

export interface RoundAnalyticsState {
  currentRoundId: string | null;
  currentHoleNumber: number;
  isRoundActive: boolean;
  /** Optimizer runs captured this round, keyed by holeNumber */
  optimizerRunsByHole: Record<number, OptimizerRunEvent[]>;
  /** AI club selections captured this round, keyed by holeNumber */
  aiSelectionsByHole: Record<number, AIClubSelectionEvent[]>;
}
