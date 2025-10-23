/**
 * Authentication Service
 * Handles user authentication with Firebase Auth
 * Supports email/password and Google Sign-In
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserMetadata } from '@/types/user';

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  try {
    if (!auth) {
      throw new Error('Authentication is not initialized');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Send email verification
    await sendEmailVerification(user);

    // Create user metadata in Firestore
    await createUserMetadata(user);

    return user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  try {
    console.log('[Auth Debug] Starting signIn...');
    console.log('[Auth Debug] Email:', email);
    console.log('[Auth Debug] Auth initialized:', !!auth);

    if (!auth) {
      console.error('[Auth Debug] CRITICAL: Firebase Auth is not initialized!');
      throw new Error('Authentication is not initialized');
    }

    console.log('[Auth Debug] Calling signInWithEmailAndPassword...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('[Auth Debug] Sign in successful, user:', userCredential.user.uid);

    // Update last login time
    console.log('[Auth Debug] Updating last login...');
    await updateLastLogin(userCredential.user.uid);
    console.log('[Auth Debug] Last login updated');

    return userCredential.user;
  } catch (error: any) {
    console.error('[Auth Debug] Sign in error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      fullError: error
    });
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    console.log('[Auth Debug] Starting Google sign in...');
    console.log('[Auth Debug] Auth initialized:', !!auth);

    if (!auth) {
      console.error('[Auth Debug] CRITICAL: Firebase Auth is not initialized!');
      throw new Error('Authentication is not initialized');
    }

    console.log('[Auth Debug] Creating Google provider...');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log('[Auth Debug] Opening Google sign-in popup...');
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    console.log('[Auth Debug] Google sign in successful, user:', user.uid);

    // Check if user metadata exists, create if not
    if (!db) {
      console.error('[Auth Debug] CRITICAL: Firestore is not initialized!');
      throw new Error('Firestore is not initialized');
    }

    console.log('[Auth Debug] Checking user metadata...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      console.log('[Auth Debug] Creating new user metadata...');
      await createUserMetadata(user);
    } else {
      console.log('[Auth Debug] Updating last login...');
      await updateLastLogin(user.uid);
    }
    console.log('[Auth Debug] Google sign in complete');

    return user;
  } catch (error: any) {
    console.error('[Auth Debug] Google sign in error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      fullError: error
    });
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in with Apple
 */
export async function signInWithApple(): Promise<User> {
  try {
    console.log('[Auth Debug] Starting Apple sign in...');
    console.log('[Auth Debug] Auth initialized:', !!auth);

    if (!auth) {
      console.error('[Auth Debug] CRITICAL: Firebase Auth is not initialized!');
      throw new Error('Authentication is not initialized');
    }

    console.log('[Auth Debug] Creating Apple provider...');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    provider.setCustomParameters({
      // Optional: specify locale
      locale: 'en'
    });

    console.log('[Auth Debug] Opening Apple sign-in popup...');
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    console.log('[Auth Debug] Apple sign in successful, user:', user.uid);

    // Check if user metadata exists, create if not
    if (!db) {
      console.error('[Auth Debug] CRITICAL: Firestore is not initialized!');
      throw new Error('Firestore is not initialized');
    }

    console.log('[Auth Debug] Checking user metadata...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      console.log('[Auth Debug] Creating new user metadata...');
      await createUserMetadata(user);
    } else {
      console.log('[Auth Debug] Updating last login...');
      await updateLastLogin(user.uid);
    }
    console.log('[Auth Debug] Apple sign in complete');

    return user;
  } catch (error: any) {
    console.error('[Auth Debug] Apple sign in error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      fullError: error
    });
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    if (!auth) {
      throw new Error('Authentication is not initialized');
    }
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    if (!auth) {
      throw new Error('Authentication is not initialized');
    }
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!auth) {
    console.warn('[Auth] Firebase Auth is not initialized');
    return () => {}; // Return no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  if (!auth) {
    console.warn('[Auth] Firebase Auth is not initialized');
    return null;
  }
  return auth.currentUser;
}

/**
 * Create user metadata document in Firestore
 */
async function createUserMetadata(user: User): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  const userMetadata: UserMetadata = {
    userId: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    onboardingComplete: false,
    profileComplete: false,
    clubsComplete: false,
  };

  await setDoc(doc(db, 'users', user.uid), {
    ...userMetadata,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(userId: string): Promise<void> {
  try {
    if (!db) {
      console.error('Firestore is not initialized');
      return;
    }
    await setDoc(
      doc(db, 'users', userId),
      {
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to update last login:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get user metadata from Firestore
 */
export async function getUserMetadata(userId: string): Promise<UserMetadata | null> {
  try {
    if (!db) {
      console.error('Firestore is not initialized');
      return null;
    }
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();

    return {
      userId: userDoc.id,
      email: data.email || null,
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt,
      onboardingComplete: data.onboardingComplete || false,
      profileComplete: data.profileComplete || false,
      clubsComplete: data.clubsComplete || false,
    };
  } catch (error) {
    console.error('Failed to get user metadata:', error);
    return null;
  }
}

/**
 * Convert Firebase error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Invalid email address. Please check and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}
