import { LatLng } from './geo';

// What the rules engine reads about each optimizer call.
export interface ShotEventInput {
  eventId: string;
  timestamp: number;
  gpsPosition: LatLng | null;
  predictedLanding: LatLng | null;
  actualLanding: LatLng | null;
  // Free-form metadata from the optimizer (lie, club picked, etc.).
  payload?: Record<string, unknown>;
}

// What the player entered on the scorecard for this hole.
export interface ScorecardHole {
  holeNumber: number;
  par: number;
  strokes: number;
  putts: number;
  fairwayHit?: boolean;        // FIR
  greenInRegulation?: boolean; // GIR
}

export interface CourseTeeBox {
  color: string; // 'white', 'red', 'blue', etc.
  position: LatLng;
}

// Course geometry for this hole. All fields optional — rules degrade
// gracefully when something's missing.
export interface CourseHoleGeometry {
  holeNumber: number;
  teeBoxes: CourseTeeBox[];
  greenCenter?: LatLng;
  fairwayPolygon?: LatLng[];
}

export interface ReconcileInputs {
  events: ShotEventInput[];        // chronologically sorted
  scorecard: ScorecardHole;
  selectedTeeColor: string;        // round-level setting
  courseHole?: CourseHoleGeometry; // optional
}

export type RuleId =
  | 'rule1-wrong-tee'
  | 'rule2-cluster'
  | 'rule3-stroke-count'
  | 'rule4-fir-mismatch'
  | 'rule5-up-and-down'
  | 'rule6-chain-orphan'
  | 'llm-judge';

export type Confidence = 'high' | 'medium' | 'low';

export interface AgentDecision {
  eventId: string;
  kept: boolean;
  confidence: Confidence;
  reason: string;
  ruleId: RuleId | '';
}

export interface ReconcileResult {
  decisions: AgentDecision[];
  expectedKept: number;     // = strokes - putts
  actualKept: number;
  needsLlmJudge: boolean;   // true when kept count doesn't match expected
}
