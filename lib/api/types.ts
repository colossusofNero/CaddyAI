/**
 * API Type Definitions
 * Complete type system for the CaddyAI data management layer
 */

// ============================================
// Core Database Types (matches Firebase schema)
// ============================================

export interface Club {
  id: string;
  userId: string;
  name: string;
  takeback: 'Full' | '3/4' | '1/2' | '1/4' | 'Pitch' | 'Chip' | 'Flop';
  face: 'Draw' | 'Square' | 'Fade' | 'Hood' | 'Open' | 'Flat';
  carryYards: number;
  minDistance?: number;
  maxDistance?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Round {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  date: string; // ISO date string
  score: number;
  handicapDifferential?: number;
  holes: RoundHole[];
  weather?: WeatherConditions;
  createdAt: number;
  updatedAt: number;
}

export interface RoundHole {
  holeNumber: number;
  par: number;
  score?: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  shots?: Shot[];
}

export interface Shot {
  id: string;
  roundId: string;
  holeNumber: number;
  clubId: string;
  clubName: string;
  distance: number;
  result: 'fairway' | 'green' | 'rough' | 'bunker' | 'water' | 'OB';
  shotNumber: number; // 1st, 2nd, 3rd shot, etc.
  createdAt: number;
}

export interface Course {
  id: string;
  name: string;
  location: string;
  address?: string;
  latitude: number;
  longitude: number;
  holes: number; // 9 or 18
  par: number;
  rating?: number; // Course rating
  slope?: number; // Slope rating
  imageUrl?: string;
  website?: string;
  phone?: string;
  teeBoxes?: TeeBox[];
  createdAt: number;
  updatedAt: number;
}

export interface TeeBox {
  name: string; // Championship, Blue, White, Red, etc.
  color: string;
  rating: number;
  slope: number;
  yardage: number;
}

export interface Hole {
  courseId: string;
  holeNumber: number;
  par: number;
  yardage: number;
  handicap: number; // Stroke index
  description?: string;
}

export interface WeatherConditions {
  temperature: number; // Fahrenheit
  condition: string; // sunny, cloudy, rainy, windy, etc.
  windSpeed: number; // mph
  windDirection?: string;
  humidity?: number;
  timestamp: number;
}

// ============================================
// User Statistics
// ============================================

export interface UserStatistics {
  userId: string;
  totalRounds: number;
  totalHoles: number;
  averageScore: number;
  bestScore: number;
  currentHandicap: number;
  fairwaysHit: number;
  fairwaysHitPercentage: number;
  greensInRegulation: number;
  greensInRegulationPercentage: number;
  averagePutts: number;
  totalBirdies: number;
  totalPars: number;
  totalBogeys: number;
  totalDoubleBogeys: number;
  favoriteClub?: string;
  averageDriveDistance: number;
  lastUpdated: number;
}

// ============================================
// Real-time Tracking
// ============================================

export interface ActiveRound {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  currentHole: number;
  startedAt: string;
  completedAt?: string;
  holes: RoundHole[];
  lastActivity: number;
}

export interface OnlineGolfer {
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  currentHole: number;
  courseId: string;
  courseName: string;
  lastActivity: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateClubRequest {
  name: string;
  takeback: Club['takeback'];
  face: Club['face'];
  carryYards: number;
}

export interface UpdateClubRequest extends Partial<CreateClubRequest> {
  id: string;
}

export interface CreateRoundRequest {
  courseId: string;
  courseName: string;
  date: string;
  holes: RoundHole[];
  weather?: WeatherConditions;
}

export interface UpdateRoundRequest extends Partial<CreateRoundRequest> {
  id: string;
}

export interface SearchCoursesRequest {
  query?: string;
  location?: { latitude: number; longitude: number };
  radius?: number; // miles
  limit?: number;
  offset?: number;
}

export interface CourseSearchResult {
  courses: Course[];
  total: number;
  hasMore: boolean;
}

// ============================================
// Sync and Offline Support
// ============================================

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: 'clubs' | 'rounds' | 'shots' | 'courses';
  data: any;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export interface SyncStatus {
  lastSync: number;
  pendingChanges: number;
  isSyncing: boolean;
  error?: string;
}

// ============================================
// API Response Wrapper
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// ============================================
// Helper Types
// ============================================

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface QueryOptions {
  orderBy?: string;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

// ============================================
// iGolf API Integration Types
// ============================================

/**
 * iGolf Course (from CourseList API)
 * Partial course data returned by search queries
 */
export interface IGolfCourse {
  id_course: number;
  courseName: string;
  address1: string;
  address2?: string;
  city: string;
  id_state: number;
  stateName?: string;
  zipCode: string;
  id_country: number;
  countryName?: string;
  phone: string;
  url?: string;
  latitude: number;
  longitude: number;
  layoutHoles: number; // 9 or 18
  class?: string; // public, private, resort, etc.
  weekday18?: number; // Pricing
  weekend18?: number;
  twilight?: number;
  recommendRating?: number;
  slope?: number;
  rating?: number;
  yardage?: number;
  par?: number;
  architect?: string;
  yearBuilt?: number;
  seasonOpen?: string;
  seasonClose?: string;
  drivingRange?: boolean;
  puttingGreen?: boolean;
  chippingArea?: boolean;
  practiceArea?: boolean;
  proShop?: boolean;
  golfLessons?: boolean;
  caddyService?: boolean;
  clubRental?: boolean;
  golfCarts?: boolean;
  pullCarts?: boolean;
  restaurant?: boolean;
  reception?: boolean;
  lodging?: boolean;
}

/**
 * iGolf Course Details (from CourseDetails API)
 * Complete course data with all available fields
 */
export interface IGolfCourseDetails extends IGolfCourse {
  description?: string;
  courseRating?: number;
  slopeRating?: number;
  courseLength?: number;
  holeDetails?: IGolfHoleDetail[];
  teeBoxes?: IGolfTeeBox[];
  facilities?: string[];
  rules?: string;
  dressCode?: string;
  playPolicy?: string;
  certifications?: string[];
  awards?: string[];
  reviews?: IGolfReview[];
  photos?: string[];
}

/**
 * iGolf Hole Detail
 */
export interface IGolfHoleDetail {
  holeNumber: number;
  par: number;
  yardage: number;
  handicap: number;
  description?: string;
}

/**
 * iGolf Tee Box
 */
export interface IGolfTeeBox {
  name: string;
  color: string;
  rating: number;
  slope: number;
  yardage: number;
  par: number;
}

/**
 * iGolf Review
 */
export interface IGolfReview {
  rating: number;
  comment?: string;
  author?: string;
  date?: string;
}

/**
 * Course List Search Parameters
 * Maps to iGolf CourseList API filters
 */
export interface CourseListParams {
  // Location-based search
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles

  // Text search
  searchText?: string; // Minimum 4 characters

  // Filter by location
  city?: string;
  stateId?: number; // iGolf state ID
  countryId?: number; // Default 1 for USA
  zipCode?: string;

  // Filter by attributes
  holes?: 9 | 18;
  classType?: string; // public, private, resort
  minRating?: number;
  maxRating?: number;

  // Amenities filters
  drivingRange?: boolean;
  puttingGreen?: boolean;
  restaurant?: boolean;
  lodging?: boolean;

  // Pagination
  page?: number;
  limit?: number; // Max 100 per iGolf API

  // Sorting
  sortBy?: 'name' | 'rating' | 'distance';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Course Cache Metadata
 * Track cache source, TTL, and refresh status
 */
export interface CourseCacheMetadata {
  courseId: string;
  source: 'firebase' | 'igolf' | 'manual';
  cachedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  lastRefreshed?: number;
  refreshInProgress?: boolean;
  igolfCourseId?: number; // Original iGolf ID
  version: number; // Schema version for migrations
}

/**
 * HMAC Signature Response
 * Returned by /api/igolf/signature
 */
export interface IGolfSignatureResponse {
  signature: string;
  apiKey: string;
  timestamp: number;
  error?: string;
}

/**
 * iGolf API Response Wrapper
 */
export interface IGolfApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  page?: number;
  totalPages?: number;
  totalResults?: number;
}

/**
 * Extended Course type with source tracking
 */
export interface CourseWithSource extends Course {
  source?: 'firebase' | 'igolf' | 'manual';
  igolfCourseId?: number;
}
