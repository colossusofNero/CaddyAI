/**
 * Server-side Stripe Configuration
 *
 * This module initializes and exports the Stripe client for server-side operations.
 * Only use this in API routes and server components.
 *
 * IMPORTANT: This uses the secret key and should NEVER be imported in client components.
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'Missing STRIPE_SECRET_KEY environment variable. ' +
    'Please add it to your .env.local file. ' +
    'Get your key from: https://dashboard.stripe.com/test/apikeys'
  );
}

// Initialize Stripe with the latest API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
  // Enable telemetry for better debugging in Stripe dashboard
  telemetry: true,
});

// Price IDs configuration
// These will be replaced with actual Stripe Price IDs after creating products in Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || 'price_pro_monthly',
    annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL || 'price_pro_annual',
  },
  tour: {
    monthly: process.env.STRIPE_PRICE_ID_TOUR_MONTHLY || 'price_tour_monthly',
    annual: process.env.STRIPE_PRICE_ID_TOUR_ANNUAL || 'price_tour_annual',
  },
} as const;

// Subscription configuration
export const SUBSCRIPTION_CONFIG = {
  // Trial period in days (14 days as per pricing page)
  trialPeriodDays: 14,

  // Grace period for failed payments (3 days)
  gracePeriodDays: 3,

  // Allowed payment methods
  paymentMethodTypes: ['card'] as const,

  // Billing cycle anchor behavior
  billingCycleAnchor: 'unchanged' as const,
} as const;

// Webhook events to listen for
export const WEBHOOK_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
} as const;
