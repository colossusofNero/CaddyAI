/**
 * Round Analytics Types
 *
 * Data model for passive shot-to-shot analytics.
 * The system captures events DURING play and infers outcomes
 * retroactively when the hole score is entered.
 *
 * EVENT FLOW:
 *   OptimizerRun → (AI conversation → AIClubSelection) → [repeat] → HoleScoreEntered
 *   └─ Each OptimizerRun GPS position = landing zone of the PREVIOUS shot
 */

// ─────────────────────────────────────────────
// RAW EVENTS (captured passively during play)
// ─────────────────────────────────────────────

/**
 * Fired every time the user runs the optimizer.
 * GPS position of THIS run = where the PREVIOUS shot landed.
 */
export interface OptimizerRunEvent {
  eventId: string;
  roundId: string;
  userId: string;
  holeNumber: number;
  timestamp: number; // Unix ms

  // Position where optimizer was run (= landing zone of previous shot)
  gpsPosition: {
    latitude: number;
    longitude: number;
    accuracy?: number; // meters
  };

  // Optimizer inputs at time of run
  shotInputs: {
    distanceToPin: number; // yards
    lie: string;           // 'Tee' | 'Fairway' | 'Rough' | 'Sand' | 'Recovery'
    stance: string;
    elevation: number;     // feet delta
    windSpeed: number;
    windDirection: string;
    confidence: number;    // 1-5
    pinLocation?: string;
    pinSide?: string;
  };

  // What the optimizer recommended
  primaryRecommendation: {
    club: string;          // e.g., 'Driver', '7 Iron'
    expectedCarry: number; // yards
    totalDistance: number; // yards
    confidenceScore: number;
  };
  secondaryRecommendation: {
    club: string;
    expectedCarry: number;
    totalDistance: number;
    confidenceScore: number;
  };

  // Sequence context
  isFirstShotOnHole: boolean; // true if this is the tee shot
  sequenceIndex: number;       // 0-based index of optimizer runs on this hole
}

/**
 * Fired when the user tells the AI which club they're using.
 * Links to the most recent OptimizerRunEvent via optimizerEventId.
 */
export interface AIClubSelectionEvent {
  eventId: string;
  roundId: string;
  userId: string;
  holeNumber: number;
  timestamp: number;

  // Which optimizer run this selection corresponds to
  optimizerEventId: string;

  // What the user declared they would use
  selectedClub: string;

  // Did they follow the AI?
  followedPrimary: boolean;
  followedSecondary: boolean;
  overrode: boolean; // used neither suggestion
}

/**
 * Fired when the user saves the score for a hole.
 * This is the trigger that runs the inference engine.
 */
export interface HoleScoreEvent {
  eventId: string;
  roundId: string;
  userId: string;
  holeNumber: number;
  timestamp: number;

  par: number;
  score: number;           // actual strokes taken
  fairwayInRegulation: boolean | null; // null for par 3s
  greenInRegulation: boolean;
  putts: number;
  penaltyStrokes: number;
}

// ─────────────────────────────────────────────
// INFERRED SHOT RECORDS (built by inference engine)
// ─────────────────────────────────────────────

export type ShotType =
  | 'tee'          // Shot from a teebox
  | 'fairway'      // Shot from fairway
  | 'rough'        // Shot from rough
  | 'approach'     // Final shot that (attempted to) reach the green
  | 'chip'         // Short game shot around green
  | 'pitch'        // Mid-distance short game
  | 'recovery'     // Shot from hazard/sand/penalty area
  | 'putt';        // On the green

export type ShotOutcome =
  | 'on_green'         // Ball landed on the green
  | 'in_fairway'       // Ball in the fairway
  | 'in_rough'         // Ball in the rough
  | 'missed_green'     // Approach that didn't reach green
  | 'chip_on'          // Chipped onto green
  | 'unknown';         // Can't be inferred from available data

export type RecommendationCompliance =
  | 'followed_primary'
  | 'followed_secondary'
  | 'overrode'
  | 'no_ai_used';      // User didn't interact with AI for this shot

/**
 * A fully inferred shot record — the core output of the algorithm.
 * Combines raw events with inferred context.
 */
export interface InferredShotRecord {
  shotId: string;
  roundId: string;
  userId: string;
  holeNumber: number;
  par: number;
  shotNumber: number; // 1-based within the hole

  // Timing
  timestamp: number;

  // Where the shot was taken from (GPS of the optimizer run)
  startPosition: {
    latitude: number;
    longitude: number;
  } | null;

  // Where the shot landed (GPS of the NEXT optimizer run, or inferred)
  endPosition: {
    latitude: number;
    longitude: number;
  } | null;

  // Calculated distance traveled (yards, from GPS delta)
  actualDistanceTraveled: number | null;

  // Shot context at time of play
  lie: string;
  distanceToPin: number; // yards when shot was taken

  // Optimizer data
  optimizerRan: boolean;
  primarySuggestion: string | null;   // club name
  secondarySuggestion: string | null; // club name
  optimizerExpectedCarry: number | null;

  // What club was actually used
  clubUsed: string | null;
  recommendationCompliance: RecommendationCompliance;

  // Inferred outcomes
  shotType: ShotType;
  outcome: ShotOutcome;
  landedOnGreen: boolean;
  landedInFairway: boolean | null; // null for par 3s / non-tee shots

  // Distance delta: how far off was the optimizer's prediction?
  carryDeltaYards: number | null; // positive = hit it farther than expected

  // Derived from hole score
  holeScore: number;
  holePar: number;
  scoreRelativeToPar: number; // score - par
}

/**
 * Aggregated per-hole analytics, built from InferredShotRecords
 */
export interface HoleAnalytics {
  roundId: string;
  holeNumber: number;
  par: number;
  score: number;

  shots: InferredShotRecord[];
  totalShots: number;

  // Key stats
  fairwayHit: boolean | null;
  greenInRegulation: boolean;
  putts: number;
  chipShotsNeeded: number;   // shots between last optimizer and putting
  penaltyStrokes: number;

  // Recommendation compliance for this hole
  shotsWithAI: number;
  shotsFollowedAI: number;
  shotsOverrodeAI: number;
  complianceRate: number; // 0-1

  // Accuracy
  averageCarryDelta: number | null; // yards off optimizer prediction
}

/**
 * Aggregated per-club stats across multiple rounds
 */
export interface ClubAnalytics {
  clubName: string;
  totalShots: number;

  // Distance
  averageCarryYards: number;
  averageTotalYards: number;
  carryStdDevYards: number; // consistency metric
  minCarryYards: number;
  maxCarryYards: number;

  // vs Optimizer predictions
  averageCarryDeltaYards: number; // how much over/under expected
  optimizerAccuracy: number;      // % within 10 yards of prediction

  // Outcomes when this club was used
  greenHitRate: number;    // % landed on green
  fairwayHitRate: number;  // % landed in fairway (tee shots)

  // Recommendation data
  timesRecommended: number;  // times optimizer suggested this club
  timesUsed: number;         // times user actually selected this club
  followThroughRate: number; // timesUsed when recommended / timesRecommended

  // Results when following vs overriding
  outcomeWhenFollowedAI: { good: number; poor: number };
  outcomeWhenOverrodeAI: { good: number; poor: number };
}

/**
 * High-level round analytics summary
 */
export interface RoundAnalyticsSummary {
  roundId: string;
  userId: string;
  courseId?: string;
  courseName?: string;
  date: string;

  // Basic scoring
  totalScore: number;
  totalPar: number;
  scoreRelativeToPar: number;
  holesPlayed: number;

  // Tracking stats
  fairwaysHit: number;
  fairwaysTotal: number;
  fairwayPercentage: number;
  greensInRegulation: number;
  girTotal: number;
  girPercentage: number;
  totalPutts: number;
  averagePuttsPerHole: number;

  // AI usage
  totalShotsWithOptimizer: number;
  totalShotsWithAI: number;
  overallComplianceRate: number;

  // Compliance outcomes
  scoreWhenFollowedAI: number;   // avg score relative to par on holes where user followed AI
  scoreWhenOverrodeAI: number;   // avg score relative to par on holes where user overrode AI

  // Club distance accuracy
  averageCarryDeltaAllClubs: number; // yards

  // Per-hole breakdown
  holeAnalytics: HoleAnalytics[];
}

// ─────────────────────────────────────────────
// STORE STATE
// ─────────────────────────────────────────────

export interface RoundAnalyticsState {
  // Active round event buffer
  currentRoundId: string | null;
  currentHoleNumber: number;
  optimizerEvents: OptimizerRunEvent[];
  aiSelectionEvents: AIClubSelectionEvent[];
  holeScoreEvents: HoleScoreEvent[];

  // Completed inferred records
  inferredShots: InferredShotRecord[];
  holeAnalytics: HoleAnalytics[];

  // Historical aggregates (loaded from Firestore)
  clubAnalytics: ClubAnalytics[];
  recentRoundSummaries: RoundAnalyticsSummary[];

  // Loading state
  isProcessing: boolean;
  lastError: string | null;
}
