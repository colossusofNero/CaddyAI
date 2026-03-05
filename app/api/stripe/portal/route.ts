/**
 * Stripe Customer Portal API Route
 *
 * Creates a Stripe customer portal session for managing subscriptions.
 * POST /api/stripe/portal
 *
 * The customer portal allows users to:
 * - Update payment methods
 * - View billing history
 * - Cancel or update subscriptions
 * - Download invoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession, getSubscriptionStatus } from '@/services/subscriptionService';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';
import type { StripePortalSession } from '@/types/subscription';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { userId, customerId, returnUrl } = body;

    // Validate required fields
    if (!userId && !customerId) {
      return NextResponse.json(
        { error: 'User ID or Customer ID is required' },
        { status: 400 }
      );
    }

    // Ensure the authenticated user is only accessing their own portal
    if (userId && decodedToken.uid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Return URL is required' },
        { status: 400 }
      );
    }

    // Get customer ID from userId if not provided
    let finalCustomerId = customerId;
    if (!finalCustomerId && userId) {
      const subscription = await getSubscriptionStatus(userId);
      if (!subscription?.stripeCustomerId) {
        return NextResponse.json(
          { error: 'No active subscription found for this user' },
          { status: 404 }
        );
      }
      finalCustomerId = subscription.stripeCustomerId;
    }

    // Create portal session using the service
    const session = await createPortalSession(finalCustomerId!, returnUrl);

    // Return session data
    const response: StripePortalSession = {
      url: session.url,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error creating portal session:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create a portal session.' },
    { status: 405 }
  );
}
