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
 *
 * Checks both:
 * 1. users/{userId}/subscription - Stripe subscriptions
 * 2. subscriptions/{userId} - Promo code subscriptions
 *
 * Returns the active subscription with the latest end date
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

    let stripeSubscription: SubscriptionData | null = null;
    let promoSubscription: SubscriptionData | null = null;

    // Check 1: Stripe subscription in users/{userId}/subscription
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (data?.subscription) {
        const subscription = data.subscription;
        stripeSubscription = {
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
        console.log(`[Subscription Admin] Found Stripe subscription for userId: ${userId}, plan: ${stripeSubscription.plan}`);
      }
    }

    // Check 2: Promo code subscription in subscriptions/{userId}
    const promoDoc = await db.collection('subscriptions').doc(userId).get();
    if (promoDoc.exists) {
      const data = promoDoc.data();
      if (data && data.status === 'active') {
        // Check if promo subscription is still valid (not expired)
        const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
        if (endDate > new Date()) {
          promoSubscription = {
            stripeCustomerId: '',
            stripeSubscriptionId: null,
            stripePriceId: null,
            status: 'active',
            plan: data.plan === 'pro_annual' ? 'pro' : data.plan,
            billingPeriod: 'yearly',
            currentPeriodStart: data.startDate,
            currentPeriodEnd: data.endDate,
            cancelAt: null,
            canceledAt: null,
            trialStart: null,
            trialEnd: null,
            createdAt: data.startDate,
            updatedAt: data.updatedAt,
            // Additional promo info
            source: data.source,
            promoCode: data.promoCode,
          } as SubscriptionData;
          console.log(`[Subscription Admin] Found promo subscription for userId: ${userId}, source: ${data.source}`);
        } else {
          console.log(`[Subscription Admin] Promo subscription expired for userId: ${userId}`);
        }
      }
    }

    // If no subscriptions found
    if (!stripeSubscription && !promoSubscription) {
      console.log(`[Subscription Admin] No subscription data found for userId: ${userId}`);
      return null;
    }

    // If only one subscription exists, return it
    if (!stripeSubscription) return promoSubscription;
    if (!promoSubscription) return stripeSubscription;

    // Both exist - return the one with the later end date (or active promo if Stripe is free)
    if (stripeSubscription.plan === 'free') {
      return promoSubscription;
    }

    // Compare end dates and return the better one
    const stripeEnd = stripeSubscription.currentPeriodEnd?.toDate?.() || new Date(0);
    const promoEnd = promoSubscription.currentPeriodEnd?.toDate?.() || new Date(0);

    return promoEnd > stripeEnd ? promoSubscription : stripeSubscription;

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
