/**
 * Unified Recommendation Tracking Schema
 *
 * This schema tracks ALL shot optimizer runs and recommendations,
 * whether triggered by AI agent or optimizer button.
 *
 * Data Flow:
 * 1. Optimizer runs → Creates RecommendationEvent
 * 2. User responds → Updates with UserDecision
 * 3. Shot executed → Links GPS positions
 * 4. Later analysis → Compares outcome vs recommendation
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Source of the recommendation
 */
export type RecommendationSource =
  | 'optimizer-button'  // User clicked optimizer button
  | 'ai-agent'          // AI agent generated recommendation
  | 'manual';           // Manual entry/test

/**
 * Type of decision the user made
 */
export type DecisionType =
  | 'followed-primary'     // Used the #1 recommended shot
  | 'followed-secondary'   // Used the #2 or #3 recommended shot
  | 'chose-different'      // Used a completely different shot
  | 'no-decision'          // Optimizer ran but user didn't respond
  | 'abandoned';           // User left or cancelled

/**
 * GPS position data
 */
export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;       // GPS accuracy in meters
  altitude?: number;       // Elevation in meters
  timestamp: number;       // Unix timestamp when position was captured
}

/**
 * Weather and environmental conditions at time of recommendation
 */
export interface ConditionsSnapshot {
  temperature?: number;    // Fahrenheit
  windSpeed?: number;      // mph
  windDirection?: number;  // degrees (0-360)
  humidity?: number;       // percentage
  pressure?: number;       // inHg
  conditions?: string;     // "Sunny", "Cloudy", etc.
  elevationChange?: number; // feet (positive = uphill, negative = downhill)
}

/**
 * A single shot recommendation with all details
 */
export interface ShotRecommendation {
  rank: number;            // 1 = primary, 2 = secondary, etc.

  // Shot identity
  shotId: string;          // Links to shots/{userId}/shots array
  clubId: string;
  clubName: string;
  shotName: string;        // "Standard", "Flop", "Knockdown", etc.

  // Shot configuration
  takeback: string;
  face: string;

  // Distances
  carryYards: number;
  rollYards: number;
  totalYards: number;
  adjustedCarry?: number;  // After weather/elevation adjustments

  // Optimizer calculations
  expectedValue: number;   // EV score from optimizer
  successProbability?: number;

  // Why this shot was recommended
  reasoning?: string;
  adjustments?: {
    wind?: number;
    temperature?: number;
    elevation?: number;
    humidity?: number;
  };
}

/**
 * User's decision and response
 */
export interface UserDecision {
  decisionType: DecisionType;
  timestamp: number;       // When user made the decision

  // What they actually chose
  chosenShotId?: string;
  chosenClubName?: string;
  chosenShotName?: string;

  // If from AI agent conversation
  conversationContext?: {
    userResponse: string;  // What user said
    agentQuestion: string; // What agent asked
    confidence: 'high' | 'medium' | 'low'; // How certain we are about the decision
  };

  // Additional notes
  notes?: string;
}

/**
 * GPS tracking for outcome analysis
 */
export interface OutcomeTracking {
  // Position before the shot (where recommendation was made)
  positionBefore: GPSPosition;

  // Position after the shot (where ball landed)
  positionAfter?: GPSPosition;

  // Distance calculations
  actualDistanceYards?: number;  // Measured distance of the shot
  distanceToTarget?: number;     // How close to intended target

  // Simple outcome categorization (for quick analysis)
  outcome?: 'excellent' | 'good' | 'fair' | 'poor';
  landingArea?: 'green' | 'fairway' | 'rough' | 'bunker' | 'water' | 'OB';

  // Link to next recommendation (if any)
  nextRecommendationId?: string;
}

// ============================================================================
// MAIN EVENT TYPE
// ============================================================================

/**
 * A complete recommendation event
 * Stored in Firebase: recommendations/{userId}/events/{eventId}
 */
export interface RecommendationEvent {
  // Identity
  id: string;              // Unique event ID
  userId: string;

  // Context
  roundId?: string;        // Links to activeRounds or scores
  holeNumber?: number;
  shotNumber?: number;     // Which shot on this hole (1, 2, 3...)

  // When and how
  timestamp: Timestamp;
  source: RecommendationSource;

  // Environment
  gpsPosition: GPSPosition;
  conditions: ConditionsSnapshot;
  distanceToTarget: number; // Yards to green/target

  // The recommendations
  recommendations: ShotRecommendation[];

  // User's response (filled in later)
  userDecision?: UserDecision;

  // Outcome tracking (filled in after shot)
  outcome?: OutcomeTracking;

  // Metadata
  deviceType?: 'ios' | 'android' | 'web';
  appVersion?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// HELPER TYPES FOR QUERIES
// ============================================================================

/**
 * Summary stats for a user's recommendation history
 */
export interface RecommendationStats {
  userId: string;
  totalRecommendations: number;
  fromAIAgent: number;
  fromButton: number;

  // Decision patterns
  followedPrimary: number;
  followedSecondary: number;
  choseDifferent: number;
  noDecision: number;

  // Percentages
  adherenceRate: number;   // % that followed primary or secondary

  // Time range
  firstRecommendation?: Timestamp;
  lastRecommendation?: Timestamp;
  lastUpdated: Timestamp;
}

/**
 * Query filters for fetching recommendations
 */
export interface RecommendationQuery {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  roundId?: string;
  source?: RecommendationSource;
  decisionType?: DecisionType;
  limit?: number;
}

// ============================================================================
// FIREBASE COLLECTION STRUCTURE
// ============================================================================

/**
 * Firebase Collection Structure:
 *
 * /recommendations/{userId}/events/{eventId}
 *   - All recommendation events for a user
 *   - Indexed by timestamp for chronological queries
 *   - Can filter by source, decisionType, roundId
 *
 * /recommendations/{userId}/stats
 *   - Aggregated statistics (updated periodically)
 *   - Quick access without scanning all events
 *
 * /recommendations/{userId}/events/{eventId}/positions (subcollection)
 *   - Detailed GPS tracking if needed
 *   - Keeps main event document lightweight
 */

// ============================================================================
// REQUEST/RESPONSE TYPES FOR API
// ============================================================================

/**
 * Request to create a new recommendation event
 */
export interface CreateRecommendationRequest {
  userId: string;
  roundId?: string;
  holeNumber?: number;
  shotNumber?: number;
  source: RecommendationSource;
  gpsPosition: GPSPosition;
  conditions: ConditionsSnapshot;
  distanceToTarget: number;
  recommendations: Omit<ShotRecommendation, 'rank'>[]; // Rank will be assigned
  deviceType?: 'ios' | 'android' | 'web';
  appVersion?: string;
}

/**
 * Request to update user's decision
 */
export interface UpdateDecisionRequest {
  eventId: string;
  userId: string;
  decisionType: DecisionType;
  chosenShotId?: string;
  chosenClubName?: string;
  chosenShotName?: string;
  conversationContext?: UserDecision['conversationContext'];
  notes?: string;
}

/**
 * Request to update outcome after shot
 */
export interface UpdateOutcomeRequest {
  eventId: string;
  userId: string;
  positionAfter: GPSPosition;
  outcome?: OutcomeTracking['outcome'];
  landingArea?: OutcomeTracking['landingArea'];
  nextRecommendationId?: string;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  RecommendationEvent as default,
};
