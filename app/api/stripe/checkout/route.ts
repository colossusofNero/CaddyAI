/**
 * Stripe Checkout Session API Route
 *
 * Creates a Stripe checkout session for subscription payments.
 * POST /api/stripe/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_IDS, SUBSCRIPTION_CONFIG } from '@/lib/stripe';
import { createCheckoutSession } from '@/services/subscriptionService';
import type { CreateCheckoutSessionParams, StripeCheckoutSession } from '@/types/subscription';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, plan, billingPeriod, successUrl, cancelUrl, customerEmail } = body as CreateCheckoutSessionParams;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!plan || plan !== 'pro') {
      return NextResponse.json(
        { error: 'Valid plan (pro) is required' },
        { status: 400 }
      );
    }

    if (!billingPeriod || (billingPeriod !== 'monthly' && billingPeriod !== 'annual')) {
      return NextResponse.json(
        { error: 'Valid billing period (monthly or annual) is required' },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Success and cancel URLs are required' },
        { status: 400 }
      );
    }

    // Get the appropriate price ID
    const priceId = STRIPE_PRICE_IDS[plan][billingPeriod];

    // Create checkout session using the service
    const session = await createCheckoutSession({
      userId,
      plan,
      billingPeriod,
      successUrl,
      cancelUrl,
      customerEmail,
    });

    // Return session data
    const response: StripeCheckoutSession = {
      sessionId: session.id,
      url: session.url!,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error creating checkout session:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create a checkout session.' },
    { status: 405 }
  );
}
