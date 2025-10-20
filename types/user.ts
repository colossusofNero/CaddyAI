/**
 * User and Authentication Types
 */

import { User as FirebaseUser } from 'firebase/auth';

export interface User extends FirebaseUser {
  // Firebase Auth provides: uid, email, displayName, photoURL, etc.
}

export interface UserMetadata {
  userId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  onboardingComplete: boolean;
  profileComplete: boolean;
  clubsComplete: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
