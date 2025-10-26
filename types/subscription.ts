/**
 * Subscription Types
 *
 * Type definitions for subscription management and Stripe integration
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Subscription plan types
 */
export type SubscriptionPlan = 'free' | 'pro' | 'tour';

/**
 * Subscription status from Stripe
 * @see https://stripe.com/docs/api/subscriptions/object#subscription_object-status
 */
export type SubscriptionStatus =
  | 'active'          // Subscription is active and in good standing
  | 'canceled'        // Subscription has been canceled
  | 'incomplete'      // Initial payment failed
  | 'incomplete_expired' // Initial payment wasn't completed within 23 hours
  | 'past_due'        // Payment failed and pending retry
  | 'paused'          // Subscription is paused
  | 'trialing'        // In trial period
  | 'unpaid';         // All payment attempts failed

/**
 * Billing period
 */
export type BillingPeriod = 'monthly' | 'annual';

/**
 * Subscription data stored in Firestore
 * Stored at: users/{userId}/subscription
 */
export interface SubscriptionData {
  // Stripe identifiers
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;

  // Subscription details
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;

  // Timestamps
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAt: Timestamp | null;
  canceledAt: Timestamp | null;
  trialStart: Timestamp | null;
  trialEnd: Timestamp | null;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Stripe checkout session creation parameters
 */
export interface CreateCheckoutSessionParams {
  userId: string;
  plan: Exclude<SubscriptionPlan, 'free'>; // Can't checkout for free plan
  billingPeriod: BillingPeriod;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

/**
 * Stripe checkout session response
 */
export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

/**
 * Stripe customer portal session response
 */
export interface StripePortalSession {
  url: string;
}

/**
 * Subscription status response for client
 */
export interface SubscriptionStatusResponse {
  hasActiveSubscription: boolean;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string; // ISO date string
  cancelAtPeriodEnd: boolean;
  billingPeriod: BillingPeriod;
  trialEnd: string | null; // ISO date string
}

/**
 * Webhook event data for subscription updates
 */
export interface WebhookSubscriptionEvent {
  userId: string;
  subscriptionId: string;
  customerId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
  currentPeriodStart: number; // Unix timestamp
  currentPeriodEnd: number; // Unix timestamp
  cancelAt: number | null; // Unix timestamp
  canceledAt: number | null; // Unix timestamp
  trialStart: number | null; // Unix timestamp
  trialEnd: number | null; // Unix timestamp
}

/**
 * Plan features and limits
 */
export interface PlanFeatures {
  maxClubs: number | null; // null means unlimited
  maxRounds: number | null; // null means unlimited
  aiRecommendations: boolean;
  shotDispersion: boolean;
  performanceAnalytics: boolean;
  courseDatabase: boolean;
  advancedAnalytics: boolean;
  strokesGained: boolean;
  videoIntegration: boolean;
  tournamentMode: boolean;
  apiAccess: boolean;
  supportLevel: 'community' | 'priority' | 'white-glove';
}

/**
 * Plan feature configuration
 */
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    maxClubs: 10,
    maxRounds: 5,
    aiRecommendations: false,
    shotDispersion: false,
    performanceAnalytics: false,
    courseDatabase: false,
    advancedAnalytics: false,
    strokesGained: false,
    videoIntegration: false,
    tournamentMode: false,
    apiAccess: false,
    supportLevel: 'community',
  },
  pro: {
    maxClubs: null,
    maxRounds: null,
    aiRecommendations: true,
    shotDispersion: true,
    performanceAnalytics: true,
    courseDatabase: true,
    advancedAnalytics: false,
    strokesGained: false,
    videoIntegration: false,
    tournamentMode: false,
    apiAccess: false,
    supportLevel: 'priority',
  },
  tour: {
    maxClubs: null,
    maxRounds: null,
    aiRecommendations: true,
    shotDispersion: true,
    performanceAnalytics: true,
    courseDatabase: true,
    advancedAnalytics: true,
    strokesGained: true,
    videoIntegration: true,
    tournamentMode: true,
    apiAccess: true,
    supportLevel: 'white-glove',
  },
};
