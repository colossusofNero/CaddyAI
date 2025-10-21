/**
 * User Profile Types
 * Matches the structure used in React Native app (CaddyAI_rn)
 */

export interface UserProfile {
  id: string;
  email?: string | null;
  name?: string | null;
  shotShape: 'draw' | 'fade' | 'straight' | 'variable';
  handedness: 'left' | 'right';
  clubSet: string;
  clubs: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferences: {
    units: 'metric' | 'imperial';
    voiceEnabled: boolean;
    notifications: boolean;
  };
  onboardingCompletedAt?: string | null;
  onboardingDuration?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClubSetDefinition {
  id: string;
  name: string;
  description: string;
  clubs: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface PlayerProfile {
  // Core Profile (5 questions)
  dominantHand: 'Right' | 'Left';
  handicap: number;
  naturalShot: 'Draw' | 'Straight' | 'Fade';
  shotHeight: 'Low' | 'Medium' | 'High';
  yardsOfCurve5i: number; // Curve distance with 5-iron

  // Additional fields
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Experience {
  yearsPlaying: number;
  roundsPerYear: number;
  userId?: string;
}

export interface Skills {
  averageDriveDistance: number;
  strengthArea: 'Driving' | 'Approach' | 'Short Game' | 'Putting' | 'Consistent';
  improvementGoal: 'Lower Score' | 'More Consistency' | 'Longer Drives' | 'Better Short Game' | 'Course Management';
  userId?: string;
}

export interface FullProfile {
  profile: PlayerProfile;
  experience?: Experience;
  skills?: Skills;
}

// Firestore document paths
export const FIRESTORE_PATHS = {
  profile: (userId: string) => `users/${userId}/profile`,
  experience: (userId: string) => `users/${userId}/experience`,
  skills: (userId: string) => `users/${userId}/skills`,
  clubs: (userId: string) => `users/${userId}/clubs`,
} as const;
