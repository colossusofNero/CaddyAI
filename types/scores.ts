/**
 * Firebase Scoring System Types
 * Schema for golf scores, active rounds, and course metadata
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Round type options
 */
export type RoundType = '18' | '9-front' | '9-back';

/**
 * Gender for tee ratings
 */
export type TeeGender = 'M' | 'F';

/**
 * Course information
 */
export interface CourseInfo {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Tee information (required for handicap calculations)
 */
export interface ScoringTee {
  id: string;
  name: string;
  color: string;
  gender: TeeGender;
  rating: number;
  slope: number;
  yardage: number;
  par: number;
}

/**
 * Hole-by-hole score
 */
export interface FirebaseHoleScore {
  holeNumber: number;
  par: number;
  handicapIndex: number;
  yardage: number;

  strokes: number;
  adjustedStrokes: number;
  putts: number;
  penalties: number;

  fairwayHit?: boolean;
  greenInRegulation?: boolean;

  // Optional advanced stats
  drivingDistance?: number;
  sandSave?: boolean;
  upAndDown?: boolean;
  notes?: string;
}

/**
 * Aggregated statistics for a round
 */
export interface ScoreStats {
  grossScore: number;
  adjustedGrossScore: number;
  scoreDifferential: number;
  scoreToPar: number;

  totalPutts: number;
  fairwaysHit: number;
  fairwaysTotal: number;
  greensInRegulation: number;
  greensTotal: number;
  penalties: number;

  puttsPerHole?: number;
}

/**
 * GHIN posting status
 */
export interface GHINStatus {
  eligible: boolean;
  posted: boolean;
  postDate?: string;
  confirmationNumber?: string;
  errorMessage?: string;
}

/**
 * Completed round (stored in /scores collection)
 */
export interface FirebaseScore {
  // Identity
  id: string;
  userId: string;

  // Timing
  date: string;
  startTime: string;
  endTime?: string;

  // Round Type
  roundType: RoundType;

  // Course & Tee Info
  course: CourseInfo;
  tee: ScoringTee;

  // Hole-by-Hole Scores
  holes: FirebaseHoleScore[];

  // Aggregated Statistics
  stats: ScoreStats;

  // GHIN Posting Status
  ghinStatus: GHINStatus;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

/**
 * Active hole score (in-progress round)
 */
export interface ActiveHoleScore extends FirebaseHoleScore {
  completed: boolean;
}

/**
 * In-progress round (stored in /activeRounds/{userId})
 */
export interface ActiveRound {
  id: string;
  courseId: string;
  courseName: string;
  courseCity?: string;
  courseState?: string;

  tee: ScoringTee;
  roundType: RoundType;

  currentHole: number;
  startingHole: number;
  holes: ActiveHoleScore[];

  courseHandicap?: number;
  handicapIndex?: number;

  startedAt: string;
  lastActivity: string;
  deviceId: string;
  appVersion: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Course metadata (stored in /courses collection)
 */
export interface CourseMetadata {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  totalHoles: number;
  syncedAt: Timestamp;
}

/**
 * Score display helpers
 */
export interface ScoreDisplay {
  color: string;
  name: string;
  diff: number;
}

/**
 * Statistics aggregation
 */
export interface UserStatistics {
  totalRounds: number;
  averageScore: number;
  lowestScore: number;
  highestScore: number;
  averageDifferential: number;
  estimatedHandicap: number;

  fairwayPercentage: number;
  girPercentage: number;
  averagePutts: number;
  totalPenalties: number;

  birdiesOrBetter: number;
  pars: number;
  bogeys: number;
  doubleBogeyOrWorse: number;
}

/**
 * Course-specific statistics
 */
export interface CourseStatistics {
  courseId: string;
  courseName: string;
  roundsPlayed: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  lastPlayed: string;
}

/**
 * Score filters for queries
 */
export interface ScoreFilters {
  startDate?: string;
  endDate?: string;
  courseId?: string;
  roundType?: RoundType;
  postedOnly?: boolean;
}
