/**
 * Subscription Status API Route
 *
 * Gets the current subscription status for a user.
 * GET /api/stripe/subscription?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionStatusAdmin } from '@/services/subscriptionServiceAdmin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';
import type { SubscriptionStatusResponse } from '@/types/subscription';

// Simple in-memory rate limiter: max 20 requests per minute per UID
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(uid: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(uid);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(uid, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    initializeFirebaseAdmin();
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

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

    // Ensure the authenticated user is only accessing their own data (IDOR prevention)
    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limit per UID
    if (isRateLimited(userId)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
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
      const trialEndDate = status.trialEnd.toDate ? status.trialEnd.toDate() : new Date(status.trialEnd as any);
      if (trialEndDate < now) {
        // Trial has expired - downgrade to free
        effectiveStatus = 'active';
        effectivePlan = 'free';
        console.log(`[Subscription API] Trial expired for user ${userId}, downgrading to free`);
      }
    }

    // Format response
    const response: SubscriptionStatusResponse = {
      hasActiveSubscription: effectiveStatus === 'trialing' || (effectiveStatus === 'active' && effectivePlan !== 'free'),
      plan: effectivePlan,
      status: effectiveStatus,
      currentPeriodEnd: status.currentPeriodEnd?.toDate ? status.currentPeriodEnd.toDate().toISOString() : new Date(status.currentPeriodEnd as any).toISOString(),
      cancelAtPeriodEnd: status.cancelAt !== null,
      billingPeriod: status.billingPeriod,
      trialEnd: status.trialEnd ? (status.trialEnd.toDate ? status.trialEnd.toDate().toISOString() : new Date(status.trialEnd as any).toISOString()) : null,
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
