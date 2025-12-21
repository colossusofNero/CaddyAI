/**
 * Server-Side Subscription Service
 * Uses Firebase Admin SDK for API routes
 * Bypasses Firestore security rules
 */

import { getAdminDb } from './firebaseAdmin';
import type { SubscriptionData } from '@/types/subscription';

/**
 * Get subscription status from Firestore using Admin SDK
 * For use in API routes and server-side operations
 */
export async function getSubscriptionStatusAdmin(
  userId: string
): Promise<SubscriptionData | null> {
  try {
    const db = getAdminDb();

    // Check if db is properly initialized
    if (!db) {
      console.error('[Subscription Admin] Firebase Admin DB is not initialized');
      throw new Error('Firebase Admin not configured. Please set up Firebase Admin credentials.');
    }

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.log(`[Subscription Admin] No user document found for userId: ${userId}`);
      return null;
    }

    const data = userDoc.data();
    if (!data || !data.subscription) {
      console.log(`[Subscription Admin] No subscription data found for userId: ${userId}`);
      return null;
    }

    // Convert Firestore Timestamps to format expected by SubscriptionData
    const subscription = data.subscription;
    return {
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripePriceId: subscription.stripePriceId,
      status: subscription.status,
      plan: subscription.plan,
      billingPeriod: subscription.billingPeriod,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAt: subscription.cancelAt || null,
      canceledAt: subscription.canceledAt || null,
      trialStart: subscription.trialStart || null,
      trialEnd: subscription.trialEnd || null,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    } as SubscriptionData;
  } catch (error) {
    console.error('[Subscription Admin] Error fetching subscription status:', error);

    // If it's a Firebase Admin configuration error, provide helpful message
    if (error instanceof Error && error.message.includes('Firebase Admin')) {
      throw new Error(
        'Firebase Admin SDK is not properly configured. ' +
        'Please add Firebase Admin credentials to your Vercel environment variables.'
      );
    }

    throw error;
  }
}

/**
 * Update subscription data in Firestore using Admin SDK
 * For use in webhook handlers and server-side operations
 */
export async function updateSubscriptionInFirestoreAdmin(
  userId: string,
  subscriptionData: Partial<SubscriptionData>
): Promise<void> {
  try {
    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);

    await userRef.set(
      {
        subscription: {
          ...subscriptionData,
          updatedAt: new Date(),
        },
      },
      { merge: true }
    );

    console.log(`[Subscription Admin] Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('[Subscription Admin] Error updating subscription:', error);
    throw error;
  }
}

/**
 * Initialize a free subscription for a new user using Admin SDK
 */
export async function initializeFreeSubscriptionAdmin(userId: string): Promise<void> {
  try {
    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);
    const now = new Date();
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const freeSubscription: Partial<SubscriptionData> = {
      stripeCustomerId: '',
      stripeSubscriptionId: null,
      stripePriceId: null,
      status: 'active',
      plan: 'free',
      billingPeriod: 'monthly',
      currentPeriodStart: now as any,
      currentPeriodEnd: oneYearFromNow as any,
      cancelAt: null,
      canceledAt: null,
      trialStart: null,
      trialEnd: null,
      createdAt: now as any,
      updatedAt: now as any,
    };

    await userRef.set(
      {
        subscription: freeSubscription,
      },
      { merge: true }
    );

    console.log(`[Subscription Admin] Free subscription initialized for user ${userId}`);
  } catch (error) {
    console.error('[Subscription Admin] Error initializing free subscription:', error);
    throw error;
  }
}
