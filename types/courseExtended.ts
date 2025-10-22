/**
 * Extended Course Types
 * Additional types for course details, holes, and reviews
 *
 * NOTE: This is deprecated. Use @/src/types/courseExtended instead.
 */

export interface CourseExtended {
  id: string;
  name: string;
  location: string;
  holes?: CourseHoleExtended[];
  reviews?: CourseReview[];
  rating?: number;
  reviewCount?: number;
  facilities?: string[];
  designer?: string;
  yearBuilt?: number;
  slope?: number;
  courseRecord?: number;
}

export interface CourseHoleExtended {
  number: number;
  par: number;
  distance: number;
  handicap: number;
  description?: string;
  tips?: string[];
  hazards?: string[];
}

export interface CourseReview {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}
