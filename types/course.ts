/**
 * iGolf Course Types
 *
 * Type definitions for iGolf API course data
 */

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface HoleYardage {
  teeBox: string; // 'black', 'blue', 'white', 'gold', 'red'
  yardage: number;
  par: number;
  handicap: number;
}

export interface Hole {
  id: string;
  holeNumber: number;
  par: number;
  handicap: number;
  yardages: HoleYardage[];
  gpsCoordinates: {
    tee: GPSCoordinates;
    green: GPSCoordinates;
    center?: GPSCoordinates;
  };
  description?: string;
  imageUrl?: string;
}

export interface TeeBox {
  name: string;
  color: string;
  rating: number;
  slope: number;
  totalYardage: number;
}

export interface Scorecard {
  courseId: string;
  courseName: string;
  teeBoxes: TeeBox[];
  holes: Hole[];
  totalPar: number;
}

export interface CourseLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: GPSCoordinates;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  location: CourseLocation;
  holes: number; // 9 or 18
  par: number;
  rating?: number;
  slope?: number;
  architect?: string;
  yearBuilt?: number;
  phoneNumber?: string;
  website?: string;
  email?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseSearchResult {
  courses: Course[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FavoriteCourse {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  location: string;
  imageUrl?: string;
  addedAt: string;
}

export interface ActiveRound {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  currentHole: number;
  startedAt: string;
  completedAt?: string;
  holes: RoundHole[];
}

export interface RoundHole {
  holeNumber: number;
  par: number;
  score?: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
}

/**
 * iGolf API Request/Response Types
 */

export interface IGolfSearchParams {
  query?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // miles
  holes?: 9 | 18;
  page?: number;
  pageSize?: number;
}

export interface IGolfCourseDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  holes: number;
  rating: number;
  slope: number;
  par: number;
  yardage: number;
  phoneNumber?: string;
  website?: string;
  description?: string;
}

export interface IGolfHoleData {
  holeNumber: number;
  par: number;
  handicap: number;
  yardages: {
    [teeBox: string]: number;
  };
  gps: {
    teeLatitude: number;
    teeLongitude: number;
    greenLatitude: number;
    greenLongitude: number;
  };
}

export interface IGolfScorecardData {
  courseId: string;
  courseName: string;
  holes: IGolfHoleData[];
  teeBoxes: {
    name: string;
    rating: number;
    slope: number;
    totalYardage: number;
  }[];
}

/**
 * iGolf 3D Viewer Types
 */

export interface IGolf3DViewerConfig {
  apiKey: string;
  courseId: string;
  containerId: string;
  options?: {
    initialHole?: number;
    showControls?: boolean;
    autoRotate?: boolean;
    height?: string;
    width?: string;
  };
}

export interface IGolf3DViewerInstance {
  loadCourse: (courseId: string) => Promise<void>;
  goToHole: (holeNumber: number) => void;
  dropPin: (latitude: number, longitude: number) => void;
  getCurrentHole: () => number;
  destroy: () => void;
}
