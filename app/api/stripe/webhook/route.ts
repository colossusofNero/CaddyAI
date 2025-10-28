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
import { updateSubscriptionInFirestore } from '@/services/subscriptionService';
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

  // Update subscription in Firestore
  await updateSubscriptionInFirestore(userId, {
    userId,
    customerId: subscription.customer as string,
    subscriptionId: subscription.id,
    priceId: priceId || null,
    status: subscription.status as any,
    plan,
    billingPeriod,
    currentPeriodStart: (subscription as any).currentPeriodStart || (subscription as any).current_period_start,
    currentPeriodEnd: (subscription as any).currentPeriodEnd || (subscription as any).current_period_end,
    cancelAt: subscription.cancel_at || (subscription as any).cancelAt,
    canceledAt: subscription.canceled_at || (subscription as any).canceledAt,
    trialStart: subscription.trial_start || (subscription as any).trialStart,
    trialEnd: subscription.trial_end || (subscription as any).trialEnd,
  });
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Update to free plan
  await updateSubscriptionInFirestore(userId, {
    userId,
    customerId: subscription.customer as string,
    subscriptionId: subscription.id,
    priceId: null,
    status: 'canceled',
    plan: 'free',
    billingPeriod: 'monthly',
    currentPeriodStart: (subscription as any).currentPeriodStart || (subscription as any).current_period_start,
    currentPeriodEnd: (subscription as any).currentPeriodEnd || (subscription as any).current_period_end,
    cancelAt: null,
    canceledAt: subscription.canceled_at || (subscription as any).canceledAt,
    trialStart: null,
    trialEnd: null,
  });
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
function determinePlanFromPriceId(priceId?: string): 'free' | 'pro' | 'tour' {
  if (!priceId) return 'free';

  if (
    priceId === STRIPE_PRICE_IDS.pro.monthly ||
    priceId === STRIPE_PRICE_IDS.pro.annual
  ) {
    return 'pro';
  }

  if (
    priceId === STRIPE_PRICE_IDS.tour.monthly ||
    priceId === STRIPE_PRICE_IDS.tour.annual
  ) {
    return 'tour';
  }

  return 'free';
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
