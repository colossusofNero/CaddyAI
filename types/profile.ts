/**
 * User Profile Types
 * Matches the structure used in React Native app (CaddyAI_rn)
 */

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
