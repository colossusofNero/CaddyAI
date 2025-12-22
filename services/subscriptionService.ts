/**
 * Subscription Service
 *
 * Handles subscription management, Stripe integration, and Firestore updates.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { stripe, STRIPE_PRICE_IDS, SUBSCRIPTION_CONFIG } from '@/lib/stripe';
import type {
  SubscriptionData,
  CreateCheckoutSessionParams,
  WebhookSubscriptionEvent,
  SubscriptionPlan,
  BillingPeriod,
} from '@/types/subscription';
import type Stripe from 'stripe';

// Initialize Firebase (reuse existing instance if available)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caddyai-aaabd',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const { userId, plan, billingPeriod, successUrl, cancelUrl, customerEmail } = params;

  // Get the price ID for the selected plan and billing period
  const priceId = STRIPE_PRICE_IDS[plan][billingPeriod];

  // Check if user already has a Stripe customer ID
  let customerId: string | undefined;
  const existingSubscription = await getSubscriptionStatus(userId);
  if (existingSubscription?.stripeCustomerId) {
    customerId = existingSubscription.stripeCustomerId;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: SUBSCRIPTION_CONFIG.trialPeriodDays,
      metadata: {
        userId,
        plan,
        billingPeriod,
      },
    },
    metadata: {
      userId,
      plan,
      billingPeriod,
    },
    payment_method_types: [...SUBSCRIPTION_CONFIG.paymentMethodTypes],
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription status from Firestore
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionData | null> {
  try {
    const subscriptionRef = doc(db, 'users', userId);
    const docSnap = await getDoc(subscriptionRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    if (!data.subscription) {
      return null;
    }

    return data.subscription as SubscriptionData;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }
}

/**
 * Update subscription data in Firestore
 */
export async function updateSubscriptionInFirestore(
  userId: string,
  data: WebhookSubscriptionEvent
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const now = Timestamp.now();

    // Convert Unix timestamps to Firestore Timestamps
    const subscriptionData: SubscriptionData = {
      stripeCustomerId: data.customerId,
      stripeSubscriptionId: data.subscriptionId,
      stripePriceId: data.priceId,
      status: data.status,
      plan: data.plan,
      billingPeriod: data.billingPeriod,
      currentPeriodStart: Timestamp.fromMillis(data.currentPeriodStart * 1000),
      currentPeriodEnd: Timestamp.fromMillis(data.currentPeriodEnd * 1000),
      cancelAt: data.cancelAt ? Timestamp.fromMillis(data.cancelAt * 1000) : null,
      canceledAt: data.canceledAt ? Timestamp.fromMillis(data.canceledAt * 1000) : null,
      trialStart: data.trialStart ? Timestamp.fromMillis(data.trialStart * 1000) : null,
      trialEnd: data.trialEnd ? Timestamp.fromMillis(data.trialEnd * 1000) : null,
      createdAt: now,
      updatedAt: now,
    };

    // Check if user document exists
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing document
      await setDoc(
        userRef,
        {
          subscription: {
            ...subscriptionData,
            createdAt: userSnap.data().subscription?.createdAt || now,
            updatedAt: now,
          },
        },
        { merge: true }
      );
    } else {
      // Create new document with subscription
      await setDoc(userRef, {
        subscription: subscriptionData,
      });
    }

    console.log(`Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('Error updating subscription in Firestore:', error);
    throw error;
  }
}

/**
 * Initialize a free subscription for a new user
 */
export async function initializeFreeSubscription(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const now = Timestamp.now();
    const oneYearFromNow = Timestamp.fromMillis(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const freeSubscription: SubscriptionData = {
      stripeCustomerId: '',
      stripeSubscriptionId: null,
      stripePriceId: null,
      status: 'active',
      plan: 'free',
      billingPeriod: 'monthly',
      currentPeriodStart: now,
      currentPeriodEnd: oneYearFromNow,
      cancelAt: null,
      canceledAt: null,
      trialStart: null,
      trialEnd: null,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(
      userRef,
      {
        subscription: freeSubscription,
      },
      { merge: true }
    );

    console.log(`Free subscription initialized for user ${userId}`);
  } catch (error) {
    console.error('Error initializing free subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

/**
 * Get subscription from Stripe
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Get customer from Stripe
 */
export async function getStripeCustomer(
  customerId: string
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  return customer;
}

/**
 * Helper: Determine plan from price ID
 */
export function determinePlanFromPriceId(priceId: string): SubscriptionPlan {
  if (
    priceId === STRIPE_PRICE_IDS.pro.monthly ||
    priceId === STRIPE_PRICE_IDS.pro.annual
  ) {
    return 'pro';
  }

  return 'free';
}

/**
 * Helper: Determine billing period from price ID
 */
export function determineBillingPeriodFromPriceId(priceId: string): BillingPeriod {
  if (
    priceId === STRIPE_PRICE_IDS.pro.annual ||
    priceId === STRIPE_PRICE_IDS.tour.annual
  ) {
    return 'annual';
  }

  return 'monthly';
}
