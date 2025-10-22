/**
 * User Types - Matches Mobile App Structure
 *
 * Firebase Collections:
 * - users/{userId}
 * - profiles/{userId}
 * - clubs/{userId}
 * - preferences/{userId}
 */

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
}

export interface UserProfile {
  userId: string;
  // 5 core questions from mobile onboarding
  dominantHand: 'right' | 'left';
  handicap: number;
  typicalShotShape: 'draw' | 'straight' | 'fade';
  height: number; // inches
  curveTendency: number; // -10 to +10 scale

  // Experience (2 questions)
  yearsPlaying?: number;
  playFrequency?: 'weekly' | 'monthly' | 'occasionally' | 'rarely';

  // Skills (3 questions)
  driveDistance?: number; // yards
  strengthLevel?: 'high' | 'medium' | 'low';
  improvementGoal?: string;

  // Metadata
  updatedAt: number;
  createdAt: number;
}

export interface ClubData {
  name: string;
  takeback: 'Full' | '3/4' | '1/2' | '1/4' | 'Pitch' | 'Chip' | 'Flop';
  face: 'Draw' | 'Square' | 'Fade' | 'Hood' | 'Open' | 'Flat';
  carryYards: number;
  updatedAt?: number;
}

export interface UserClubs {
  userId: string;
  clubs: ClubData[]; // 26 clubs
  updatedAt: number;
  createdAt: number;
}
