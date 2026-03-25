/**
 * Redeem Promo Code API Route
 * POST /api/promo/redeem
 *
 * Validates the promo code, then creates a Stripe Checkout session with
 * trial_period_days equal to the promo duration. This collects a credit card
 * upfront (charges $0 today) and starts billing automatically when the
 * promo period ends.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase ID token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    initializeFirebaseAdmin();
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const { code, billingPeriod, successUrl, cancelUrl, customerEmail } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'No code provided' }, { status: 400 });
    }

    const { getAdminDb } = await import('@/services/firebaseAdmin');
    const db = getAdminDb();
    const upperCode = code.toUpperCase();

    // Look up and validate promo code
    const promoRef = db.collection('promoCodes').doc(upperCode);
    const promoDoc = await promoRef.get();

    if (!promoDoc.exists) {
      return NextResponse.json({ success: false, message: 'Invalid promo code' }, { status: 400 });
    }

    const promo = promoDoc.data()!;

    if (!promo.active) {
      return NextResponse.json({ success: false, message: 'This code is no longer active' }, { status: 400 });
    }

    if (promo.maxRedemptions > 0 && promo.currentRedemptions >= promo.maxRedemptions) {
      return NextResponse.json({ success: false, message: 'This code has been fully redeemed' }, { status: 400 });
    }

    // Check if user already redeemed this code
    const redemptionRef = db.collection('promoCodes').doc(upperCode).collection('redemptions').doc(userId);
    const existingRedemption = await redemptionRef.get();
    if (existingRedemption.exists) {
      return NextResponse.json({ success: false, message: 'You have already redeemed this code' }, { status: 400 });
    }

    // Determine trial days from promo code
    const trialDays = promo.durationDays || 365;

    // Get the price ID (default to annual)
    const period = billingPeriod === 'monthly' ? 'monthly' : 'annual';
    const priceId = STRIPE_PRICE_IDS.pro[period];

    // Create Stripe Checkout session with promo trial period
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail || decodedToken.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${request.nextUrl.origin}/dashboard?promo_redeemed=true`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/redeem?code=${upperCode}&canceled=true`,
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          userId,
          plan: 'pro',
          billingPeriod: period,
          promoCode: upperCode,
          source: 'promo_code',
        },
      },
      metadata: {
        userId,
        plan: 'pro',
        billingPeriod: period,
        promoCode: upperCode,
        source: 'promo_code',
      },
      payment_method_types: ['card'],
    });

    // Mark the promo code as used (increment count + record redemption)
    const batch = db.batch();
    batch.update(promoRef, {
      currentRedemptions: FieldValue.increment(1),
    });
    batch.set(redemptionRef, {
      userId,
      redeemedAt: new Date(),
      stripeSessionId: session.id,
      durationDays: trialDays,
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[Promo Redeem] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
