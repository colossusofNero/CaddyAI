/**
 * USGA GHIN API Type Definitions
 * Types for Scorecard Action Series API
 */

// ============================================
// GHIN API Response Types
// ============================================

/**
 * CourseTeeDetails Response
 * Returns slope, rating, name, color, yardage for teeboxes
 */
export interface GHINTeeDetailsResponse {
  Status: number; // 1 = Success, -1 = Error
  ErrorMessage: string;
  teesList: GHINTeeInfo[];
}

export interface GHINTeeInfo {
  gender: 'men' | 'wmn';
  ratingMen: number;
  ratingWomen: number;
  slopeMen: number;
  slopeWomen: number;
  teeName: string;
  teeColorName: string;
  teeColorValue: string; // Hex color, no color = FF00FF
  ydsTotal: number;
  // Additional fields when detailLevel=2
  yds1to9?: number;
  yds10to18?: number;
  yds1to18?: number;
  ydsHole?: number[]; // Array of 18 yards
}

/**
 * CourseScorecardDetails Response
 * Returns par and handicap information for a course
 */
export interface GHINScorecardDetailsResponse {
  Status: number;
  ErrorMessage: string;
  menScorecardList: GHINScorecard[];
  wmnScorecardList: GHINScorecard[];
}

export interface GHINScorecard {
  hcpHole: number[]; // Handicap for each hole (1-18)
  parHole: number[]; // Par for each hole (1-18)
  parIn: number; // Back nine par (10-18)
  parOut: number; // Front nine par (1-9)
  parTotal: number; // Total par (1-18)
}

/**
 * CourseScorecardList Response
 * Returns par/handicap for multiple courses
 */
export interface GHINScorecardListResponse {
  Status: number;
  ErrorMessage: string;
  courseList: GHINCourseScorecard[];
}

export interface GHINCourseScorecard {
  id_course: string; // 12 character unique ID
  courseName?: string; // If requested in params
  menScorecardList: GHINScorecard[];
  wmnScorecardList: GHINScorecard[];
}

// ============================================
// GHIN API Request Types
// ============================================

export interface GHINTeeDetailsRequest {
  detailLevel?: '1' | '2'; // 1=Simple, 2=Full
  id_course: string;
}

export interface GHINScorecardDetailsRequest {
  id_course: string;
}

export interface GHINScorecardListRequest {
  id_courseArray: string[]; // Up to 20 course IDs
  courseName: '0' | '1'; // Include course name in response
}

// ============================================
// Enhanced Round Types for GHIN Integration
// ============================================

export interface GHINRoundData {
  // Course identification
  ghinCourseId?: string; // GHIN's 12-char course ID
  teeUsed?: string; // Tee name (e.g., "Blue", "White")
  teeColor?: string; // Hex color of tee

  // Course ratings
  courseRating?: number; // Course rating for tee used
  slopeRating?: number; // Slope rating for tee used

  // Scorecard data
  parValues?: number[]; // Par for each hole (1-18)
  handicapValues?: number[]; // Hole handicap/stroke index (1-18)

  // Calculated values
  adjustedGrossScore?: number; // Adjusted for ESC
  handicapDifferential?: number; // (113/Slope) * (AGS - Rating)

  // Posting metadata
  postedToGHIN?: boolean;
  ghinPostDate?: string; // ISO date when posted
  ghinScoreId?: string; // GHIN's score identifier if posted
}

// ============================================
// Score Posting Types
// ============================================

export interface GHINScorePostRequest {
  userId: string;
  roundId: string;
  ghinCourseId: string;
  teeUsed: string;
  grossScore: number;
  adjustedGrossScore: number;
  dateOfRound: string; // ISO date
  holes: number; // 9 or 18
}

export interface GHINScorePostResponse {
  success: boolean;
  message: string;
  scoreId?: string;
  handicapIndex?: number; // Updated handicap after posting
  error?: string;
}

// ============================================
// Utility Types
// ============================================

/**
 * Convert GHIN data to Course/TeeBox format
 */
export interface GHINTeeBoxConversion {
  name: string;
  color: string;
  rating: number;
  slope: number;
  yardage: number;
  gender: 'men' | 'women';
}

/**
 * GHIN Course Cache Entry
 * Store GHIN data in Firebase for quick access
 */
export interface GHINCourseCache {
  ghinCourseId: string;
  courseName: string;
  tees: GHINTeeBoxConversion[];
  scorecard: {
    menPar: number[];
    womenPar: number[];
    menHandicap: number[];
    womenHandicap: number[];
  };
  lastFetched: number;
  expiresAt: number; // TTL for cache
}
