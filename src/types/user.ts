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

export interface Shot {
  id: string;
  distance: number; // actual distance achieved
  date: string; // ISO date string
  conditions?: {
    temperature?: number;
    windSpeed?: number;
    windDirection?: string;
    elevation?: number;
  };
  outcome?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  createdAt: number;
}

export interface ClubData {
  id: string;
  name: string;
  distance: number; // average/expected distance in yards
  shots: Shot[]; // unlimited shot history
  createdAt: number;
  updatedAt: number;
}

export interface UserClubs {
  userId: string;
  clubs: ClubData[]; // 14 clubs max
  updatedAt: number;
  createdAt: number;
}
