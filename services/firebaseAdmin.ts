/**
 * Firebase Admin SDK Service
 * Server-side Firebase operations that bypass security rules
 * Used in API routes and server-side operations
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
export function initializeFirebaseAdmin(): { app: App; db: Firestore } {
  // Return existing instance if already initialized
  if (adminApp && adminDb) {
    return { app: adminApp, db: adminDb };
  }

  try {
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      adminDb = getFirestore(adminApp);
      return { app: adminApp, db: adminDb };
    }

    // Initialize with service account credentials
    // Option 1: Using service account JSON (recommended for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caddyai-aaabd',
      });
    }
    // Option 2: Using individual environment variables
    else if (
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    // Option 3: Development mode - initialize without credentials (will use Application Default Credentials)
    else {
      console.warn(
        '[Firebase Admin] No service account credentials found. Using default credentials. ' +
          'This may work locally with gcloud CLI but will fail in production. ' +
          'Please set FIREBASE_SERVICE_ACCOUNT or individual Firebase Admin environment variables.'
      );
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caddyai-aaabd',
      });
    }

    adminDb = getFirestore(adminApp);
    console.log('[Firebase Admin] Successfully initialized');

    return { app: adminApp, db: adminDb };
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

/**
 * Get Firestore Admin instance
 */
export function getAdminDb(): Firestore {
  if (!adminDb) {
    const { db } = initializeFirebaseAdmin();
    return db;
  }
  return adminDb;
}

/**
 * Get Firebase Admin App instance
 */
export function getAdminApp(): App {
  if (!adminApp) {
    const { app } = initializeFirebaseAdmin();
    return app;
  }
  return adminApp;
}
