/**
 * Firebase Configuration
 * Initializes Firebase for the CaddyAI web application
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration object
// IMPORTANT: In Next.js, process.env.NEXT_PUBLIC_* variables are replaced at build time
// They MUST be accessed directly (not via dynamic keys like process.env[varName])
// for the build-time replacement to work
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
// Check the actual config object values (after build-time replacement)
function validateFirebaseConfig() {
  const missing: string[] = [];

  if (!firebaseConfig.apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missing.length > 0) {
    console.error(
      '[Firebase] Missing environment variables:',
      missing.join(', ')
    );
    console.error(
      '[Firebase] Please configure Firebase in .env.local. See .env.local for setup instructions.'
    );
    return false;
  }

  return true;
}

// Check if Firebase is configured
export const isFirebaseConfigured = validateFirebaseConfig();

// Initialize Firebase (only once)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured) {
  try {
    console.log('[Firebase Debug] Starting Firebase initialization...');
    console.log('[Firebase Debug] Config present:', {
      apiKey: !!firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: !!firebaseConfig.messagingSenderId,
      appId: !!firebaseConfig.appId
    });

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    console.log('[Firebase Debug] Firebase app initialized:', app.name);

    auth = getAuth(app);
    console.log('[Firebase Debug] Firebase Auth initialized:', !!auth);

    db = getFirestore(app);
    console.log('[Firebase Debug] Firestore initialized:', !!db);

    storage = getStorage(app);
    console.log('[Firebase Debug] Storage initialized:', !!storage);

    console.log('[Firebase] Successfully initialized all services');
  } catch (error: unknown) {
    console.error('[Firebase Debug] Initialization error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string }).code,
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error
    });
    console.error('[Firebase] Initialization error:', error);
  }
} else {
  console.error('[Firebase Debug] CRITICAL: Firebase configuration is missing or invalid!');
  console.warn('[Firebase] Running in offline mode - Firebase services unavailable');
}

export { app, auth, db, storage };
export default app;
