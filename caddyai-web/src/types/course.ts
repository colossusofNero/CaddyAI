/**
 * Course & Round Types
 *
 * Firebase Collections:
 * - favoriteCourses/{userId}_{courseId}
 * - activeRounds/{userId}
 */

export interface Course {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  holes: number; // 9 or 18
  par: number;
  rating: number;
  slope: number;
  yardage: {
    front: number;
    back: number;
    total: number;
  };
}

export interface Hole {
  number: number;
  par: number;
  handicap: number;
  yardages: {
    black?: number;
    blue?: number;
    white?: number;
    gold?: number;
    red?: number;
  };
  gpsCoordinates?: {
    tee: { lat: number; lng: number };
    green: { lat: number; lng: number };
    fairway?: { lat: number; lng: number };
  };
}

export interface FavoriteCourse {
  userId: string;
  courseId: string;
  courseName: string;
  location: string;
  addedAt: number;
}

export interface ActiveRound {
  userId: string;
  courseId: string;
  courseName: string;
  currentHole: number;
  startedAt: number;
  holes: {
    number: number;
    par: number;
    score?: number;
    shots?: number;
  }[];
}
