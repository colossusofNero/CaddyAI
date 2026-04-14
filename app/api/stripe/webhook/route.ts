/**
 * Stripe Webhook API Route
 *
 * Handles Stripe webhook events for subscription management.
 * POST /api/stripe/webhook
 *
 * IMPORTANT: This endpoint must be configured in the Stripe Dashboard
 * and the webhook secret must be added to environment variables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, WEBHOOK_EVENTS, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { updateSubscriptionInFirestoreAdmin } from '@/services/subscriptionServiceAdmin';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';
import type Stripe from 'stripe';

/**
 * Verify and process Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process the event based on type
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case WEBHOOK_EVENTS.CHECKOUT_SESSION_COMPLETED: {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
      case WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED: {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED: {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case WEBHOOK_EVENTS.INVOICE_PAID: {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED: {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);

  // Extract user ID from metadata
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // If there's a subscription, it will be handled by the subscription.created event
  if (session.subscription) {
    console.log(`Subscription ${session.subscription} will be processed separately`);
  }
}

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  initializeFirebaseAdmin();

  // Extract user ID from metadata
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Get plan from subscription items
  const priceId = subscription.items.data[0]?.price.id;
  const plan = determinePlanFromPriceId(priceId);
  const billingPeriod = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly';

  // Update subscription in Firestore using Admin SDK (bypasses security rules)
  // Access period timestamps - handle both camelCase and snake_case, and the
  // Stripe API 2026-01-28+ change where current_period_start/end moved from the
  // subscription root onto items.data[0]. Fall back to items when not at root.
  const sub = subscription as any;
  const firstItem = sub.items?.data?.[0] ?? sub.items?.data?.[0] ?? {};
  const periodStart =
    sub.currentPeriodStart ??
    sub.current_period_start ??
    firstItem.currentPeriodStart ??
    firstItem.current_period_start;
  const periodEnd =
    sub.currentPeriodEnd ??
    sub.current_period_end ??
    firstItem.currentPeriodEnd ??
    firstItem.current_period_end;
  const cancelAt = sub.cancelAt ?? sub.cancel_at;
  const canceledAt = sub.canceledAt ?? sub.canceled_at;
  const trialStart = sub.trialStart ?? sub.trial_start;
  const trialEnd = sub.trialEnd ?? sub.trial_end;

  const subscriptionData = {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId || null,
    status: subscription.status as any,
    plan,
    billingPeriod,
    currentPeriodStart: periodStart ? new Date(periodStart * 1000) : new Date(),
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : new Date(),
    cancelAt: cancelAt ? new Date(cancelAt * 1000) : null,
    canceledAt: canceledAt ? new Date(canceledAt * 1000) : null,
    trialStart: trialStart ? new Date(trialStart * 1000) : null,
    trialEnd: trialEnd ? new Date(trialEnd * 1000) : null,
  };

  // Write to users/{userId}/subscription (for app auth gate)
  await updateSubscriptionInFirestoreAdmin(userId, subscriptionData as any);

  // Also write to subscriptions/{userId} (for admin tools and lookups)
  const { getAdminDb } = await import('@/services/firebaseAdmin');
  const db = getAdminDb();
  await db.collection('subscriptions').doc(userId).set({
    userId,
    email: subscription.metadata?.customerEmail || null,
    ...subscriptionData,
    cancelAtPeriodEnd: !!cancelAt,
    promoCode: subscription.metadata?.promoCode || null,
    source: subscription.metadata?.source || 'stripe',
    lastUpdated: new Date(),
    createdAt: new Date(),
  }, { merge: true });

  console.log(`Subscription synced for user ${userId} in both collections`);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  initializeFirebaseAdmin();

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Update to free plan using Admin SDK
  const sub = subscription as any;
  const firstItem = sub.items?.data?.[0] ?? {};
  const periodStart =
    sub.currentPeriodStart ?? sub.current_period_start ??
    firstItem.currentPeriodStart ?? firstItem.current_period_start;
  const periodEnd =
    sub.currentPeriodEnd ?? sub.current_period_end ??
    firstItem.currentPeriodEnd ?? firstItem.current_period_end;
  const canceledAt = sub.canceledAt ?? sub.canceled_at;

  const canceledData = {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: null,
    status: 'canceled',
    plan: 'free',
    billingPeriod: 'monthly',
    currentPeriodStart: periodStart ? new Date(periodStart * 1000) : new Date(),
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : new Date(),
    cancelAt: null,
    canceledAt: canceledAt ? new Date(canceledAt * 1000) : null,
    trialStart: null,
    trialEnd: null,
  };

  // Write to users/{userId}/subscription
  await updateSubscriptionInFirestoreAdmin(userId, canceledData as any);

  // Also update subscriptions/{userId}
  const { getAdminDb } = await import('@/services/firebaseAdmin');
  const db = getAdminDb();
  await db.collection('subscriptions').doc(userId).set({
    userId,
    ...canceledData,
    cancelAtPeriodEnd: false,
    lastUpdated: new Date(),
  }, { merge: true });

  console.log(`Subscription canceled for user ${userId} in both collections`);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id);

  // The subscription.updated event will handle the status update
  // This is mainly for logging and analytics
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  // You might want to send an email notification here
  // The subscription status will be updated via subscription.updated event
}

/**
 * Determine plan from Stripe price ID
 */
function determinePlanFromPriceId(priceId?: string): 'free' | 'pro' {
  if (!priceId) return 'free';

  if (
    priceId === STRIPE_PRICE_IDS.pro.monthly ||
    priceId === STRIPE_PRICE_IDS.pro.annual
  ) {
    return 'pro';
  }

  return 'free';
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
