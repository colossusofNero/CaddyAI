/**
 * Server-side Stripe Configuration
 *
 * This module initializes and exports the Stripe client for server-side operations.
 * Only use this in API routes and server components.
 *
 * IMPORTANT: This uses the secret key and should NEVER be imported in client components.
 */

import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars are not available
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        'Missing STRIPE_SECRET_KEY environment variable. ' +
        'Please add it to your .env.local file. ' +
        'Get your key from: https://dashboard.stripe.com/test/apikeys'
      );
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
      // Enable telemetry for better debugging in Stripe dashboard
      telemetry: true,
    });
  }

  return stripeInstance;
}

// Export stripe as a getter to ensure lazy initialization
export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const stripeClient = getStripe();
    const value = stripeClient[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(stripeClient) : value;
  }
});

// Price IDs configuration
// These will be replaced with actual Stripe Price IDs after creating products in Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || 'price_pro_monthly',
    annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL || 'price_pro_annual',
  },
} as const;

// Subscription configuration
export const SUBSCRIPTION_CONFIG = {
  // Trial period in days
  trialPeriodDays: 7,

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
