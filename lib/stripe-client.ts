/**
 * Client-side Stripe Configuration
 *
 * This module initializes and exports the Stripe.js client for client-side operations.
 * Safe to use in client components and browser environments.
 *
 * IMPORTANT: This uses the publishable key which is safe to expose in the browser.
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Validate publishable key exists
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable. ' +
    'Please add it to your .env.local file. ' +
    'Get your key from: https://dashboard.stripe.com/test/apikeys'
  );
}

// Cache the Stripe promise to avoid multiple initializations
let stripePromise: Promise<Stripe | null>;

/**
 * Get or initialize the Stripe.js instance
 * Uses a singleton pattern to ensure only one instance is created
 *
 * @returns Promise that resolves to the Stripe instance
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
    );
  }
  return stripePromise;
};

/**
 * Plan and billing period mapping for client-side usage
 */
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    description: 'Perfect for casual golfers getting started',
    priceMonthly: 0,
    priceAnnual: 0,
  },
  pro: {
    name: 'Pro',
    description: 'For serious golfers who want the full experience',
    priceMonthly: 9.95,
    priceAnnual: 79.60,
  },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;
export type BillingPeriod = 'monthly' | 'annual';
