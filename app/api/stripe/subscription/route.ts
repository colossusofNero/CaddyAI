/**
 * Subscription Status API Route
 *
 * Gets the current subscription status for a user.
 * GET /api/stripe/subscription?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionStatus } from '@/services/subscriptionService';
import type { SubscriptionStatusResponse } from '@/types/subscription';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get subscription status from service
    const status = await getSubscriptionStatus(userId);

    if (!status) {
      // User has no subscription record, return default free plan
      const response: SubscriptionStatusResponse = {
        hasActiveSubscription: false,
        plan: 'free',
        status: 'active',
        currentPeriodEnd: new Date().toISOString(),
        cancelAtPeriodEnd: false,
        billingPeriod: 'monthly',
        trialEnd: null,
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Format response
    const response: SubscriptionStatusResponse = {
      hasActiveSubscription: status.status === 'active' || status.status === 'trialing',
      plan: status.plan,
      status: status.status,
      currentPeriodEnd: status.currentPeriodEnd.toDate().toISOString(),
      cancelAtPeriodEnd: status.cancelAt !== null,
      billingPeriod: status.billingPeriod,
      trialEnd: status.trialEnd ? status.trialEnd.toDate().toISOString() : null,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error fetching subscription status:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch subscription status.' },
    { status: 405 }
  );
}
