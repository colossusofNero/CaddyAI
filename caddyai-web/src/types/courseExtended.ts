/**
 * Extended Course & Map Types
 *
 * Enhanced course data schema for web app with 2D maps
 * Firebase Collections:
 * - courses/{courseId}
 * - courseHoles/{courseId}/{holeId}
 * - courseFavorites/{userId}_{courseId}
 * - courseReviews/{courseId}/{reviewId}
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CourseLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
}

export interface CourseContact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface CourseRating {
  average: number;
  count: number;
  difficulty: number; // 1-5 scale
}

export interface CoursePricing {
  weekday?: number;
  weekend?: number;
  twilight?: number;
  currency: string;
}

export interface CourseAmenities {
  drivingRange: boolean;
  puttingGreen: boolean;
  chippingArea: boolean;
  proShop: boolean;
  restaurant: boolean;
  cartRental: boolean;
  clubRental: boolean;
  lockers: boolean;
}

export interface TeeBox {
  color: string; // 'black', 'blue', 'white', 'gold', 'red'
  name: string; // 'Championship', 'Men', 'Women', etc.
  rating: number;
  slope: number;
  yardage: number;
  par: number;
}

/**
 * Main Course Interface
 */
export interface CourseExtended {
  id: string;
  name: string;
  location: CourseLocation;
  contact: CourseContact;

  // Course Details
  holes: number; // 9 or 18
  designer?: string;
  yearBuilt?: number;
  courseType: 'public' | 'private' | 'semi-private' | 'resort';

  // Tee Boxes
  teeBoxes: TeeBox[];

  // Ratings
  rating: CourseRating;

  // Pricing
  pricing?: CoursePricing;

  // Amenities
  amenities: CourseAmenities;

  // Media
  images: string[];
  thumbnailUrl?: string;

  // Metadata
  description?: string;
  features?: string[]; // ['Links style', 'Water hazards', 'Scenic views']
  createdAt: number;
  updatedAt: number;
}

/**
 * Hole Geometry for 2D Maps
 */
export interface HoleGeometry {
  teeBoxes: LatLng[];
  fairway: LatLng[];
  green: LatLng[];
  greenCenter: LatLng;
  bunkers: LatLng[][];
  water: LatLng[][];
  trees?: LatLng[][];
  outOfBounds?: LatLng[][];
}

/**
 * Individual Hole Data
 */
export interface CourseHoleExtended {
  id: string;
  courseId: string;
  holeNumber: number;
  par: number;
  handicap: number;

  // Yardages by tee
  yardages: {
    [teeColor: string]: number;
  };

  // GPS and Geometry
  geometry?: HoleGeometry;

  // Hole characteristics
  dogleg?: 'left' | 'right' | 'none';
  waterHazards: number;
  bunkers: number;

  // Description
  description?: string;
  tips?: string;

  createdAt: number;
  updatedAt: number;
}

/**
 * Course Favorites
 */
export interface CourseFavoriteExtended {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  location: string;
  thumbnailUrl?: string;
  addedAt: number;
  lastPlayed?: number;
  timesPlayed: number;
}

/**
 * Course Reviews
 */
export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  difficulty: number; // 1-5
  condition: number; // 1-5
  value: number; // 1-5
  comment?: string;
  playedDate: number;
  createdAt: number;
  helpful: number; // upvotes
}

/**
 * Course Search Filters
 */
export interface CourseSearchFilters {
  query?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in miles
  };
  courseType?: ('public' | 'private' | 'semi-private' | 'resort')[];
  holes?: number;
  minRating?: number;
  maxPrice?: number;
  amenities?: string[];
  sortBy?: 'distance' | 'rating' | 'name' | 'price';
  limit?: number;
  offset?: number;
}

/**
 * Course Search Result
 */
export interface CourseSearchResult extends CourseExtended {
  distance?: number; // miles from user location
  matchScore?: number; // search relevance score
}

/**
 * GPS Position
 */
export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

/**
 * Distance Calculation Result
 */
export interface DistanceInfo {
  toGreen: number; // yards
  toFrontGreen: number; // yards
  toBackGreen: number; // yards
  toHazards: Array<{
    type: 'water' | 'bunker';
    distance: number;
  }>;
}

/**
 * Shot Tracking
 */
export interface Shot {
  id: string;
  holeNumber: number;
  shotNumber: number;
  position: LatLng;
  club?: string;
  distance?: number;
  timestamp: number;
}

/**
 * Active Round with GPS
 */
export interface ActiveRoundExtended {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  currentHole: number;
  startedAt: number;
  completedAt?: number;

  // GPS tracking
  gpsEnabled: boolean;
  shots: Shot[];

  // Hole scores
  holes: Array<{
    holeNumber: number;
    par: number;
    score?: number;
    putts?: number;
    fairwayHit?: boolean;
    greenInRegulation?: boolean;
    penalties?: number;
    shots: Shot[];
  }>;
}

/**
 * Offline Course Data
 */
export interface OfflineCourseData {
  course: CourseExtended;
  holes: CourseHoleExtended[];
  downloadedAt: number;
  expiresAt: number;
  size: number; // bytes
}
