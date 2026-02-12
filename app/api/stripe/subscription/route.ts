/**
 * Subscription Status API Route
 *
 * Gets the current subscription status for a user.
 * GET /api/stripe/subscription?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionStatusAdmin } from '@/services/subscriptionServiceAdmin';
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

    // Get subscription status from admin service (server-side)
    const status = await getSubscriptionStatusAdmin(userId);

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

    // Check if trial has expired
    let effectiveStatus = status.status;
    let effectivePlan = status.plan;
    const now = new Date();

    if (status.status === 'trialing' && status.trialEnd) {
      const trialEndDate = status.trialEnd.toDate ? status.trialEnd.toDate() : new Date(status.trialEnd);
      if (trialEndDate < now) {
        // Trial has expired - downgrade to free
        effectiveStatus = 'active';
        effectivePlan = 'free';
        console.log(`[Subscription API] Trial expired for user ${userId}, downgrading to free`);
      }
    }

    // Format response
    const response: SubscriptionStatusResponse = {
      hasActiveSubscription: effectiveStatus === 'active' || effectiveStatus === 'trialing',
      plan: effectivePlan,
      status: effectiveStatus,
      currentPeriodEnd: status.currentPeriodEnd?.toDate ? status.currentPeriodEnd.toDate().toISOString() : new Date(status.currentPeriodEnd).toISOString(),
      cancelAtPeriodEnd: status.cancelAt !== null,
      billingPeriod: status.billingPeriod,
      trialEnd: status.trialEnd ? (status.trialEnd.toDate ? status.trialEnd.toDate().toISOString() : new Date(status.trialEnd).toISOString()) : null,
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
