/**
 * Course Types
 *
 * Type definitions for course-related data used in the app
 */

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
