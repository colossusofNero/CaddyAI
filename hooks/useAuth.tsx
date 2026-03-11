/**
 * useAuth Hook
 * Custom React hook for authentication state management
 * Provides user state, loading state, and auth methods
 */

'use client';

import { useState, useEffect, useRef, useContext, createContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  signUp,
  signIn,
  signInWithGoogle,
  signInWithApple,
  signOut,
  resetPassword,
  onAuthStateChange,
  getUserMetadata,
} from '@/services/authService';
import { UserMetadata } from '@/types/user';

interface AuthContextType {
  user: User | null;
  userMetadata: UserMetadata | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * Wrap your app with this to provide auth context
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  // Auto sign-out on inactivity
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(async () => {
        await signOut();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);

      // Sync a client-side cookie so the middleware can detect auth state.
      // Firebase stores tokens in IndexedDB (not cookies), so without this
      // the middleware would redirect authenticated users back to /login.
      if (firebaseUser) {
        document.cookie = 'auth-token=1; path=/; SameSite=Strict; Secure; max-age=3600';
        const metadata = await getUserMetadata(firebaseUser.uid);
        setUserMetadata(metadata);
      } else {
        document.cookie = 'auth-token=; path=/; SameSite=Strict; max-age=0';
        setUserMetadata(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up method
  const handleSignUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      setError(null);
      setLoading(true);
      await signUp(email, password, displayName);
      // User state will be updated by onAuthStateChange
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in method
  const handleSignIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signIn(email, password);
      // User state will be updated by onAuthStateChange
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google sign in method
  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      // User state will be updated by onAuthStateChange
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Apple sign in method
  const handleSignInWithApple = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithApple();
      // User state will be updated by onAuthStateChange
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out method
  const handleSignOut = async () => {
    try {
      setError(null);
      setLoading(true);
      await signOut();
      // User state will be updated by onAuthStateChange
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Password reset method
  const handleResetPassword = async (email: string) => {
    try {
      setError(null);
      await resetPassword(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Clear error method
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    userMetadata,
    loading,
    error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Use this hook in any component to access auth state and methods
 *
 * @example
 * const { user, signIn, signOut } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook to check if user has completed onboarding
 */
export function useRequireOnboarding(): boolean {
  const { userMetadata } = useAuth();
  return userMetadata?.onboardingComplete || false;
}

/**
 * Hook to check if user has completed profile setup
 */
export function useRequireProfile(): boolean {
  const { userMetadata } = useAuth();
  return userMetadata?.profileComplete || false;
}

/**
 * Hook to check if user has completed club setup
 */
export function useRequireClubs(): boolean {
  const { userMetadata } = useAuth();
  return userMetadata?.clubsComplete || false;
}
