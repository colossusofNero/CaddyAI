/**
 * Redeem Promo Code API Route
 * POST /api/promo/redeem
 *
 * Redeems a promo code: increments usage, creates a subscription record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

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
    const { code } = await request.json();

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

    // Calculate subscription dates
    const now = new Date();
    const durationDays = promo.durationDays || 365;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Use a batch write for atomicity
    const batch = db.batch();

    // 1. Increment redemption count on promo code
    batch.update(promoRef, {
      currentRedemptions: FieldValue.increment(1),
    });

    // 2. Record the redemption
    batch.set(redemptionRef, {
      userId,
      redeemedAt: now,
      durationDays,
    });

    // 3. Create/update subscription in subscriptions/{userId}
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    batch.set(subscriptionRef, {
      userId,
      status: 'active',
      plan: 'pro_annual',
      source: 'promo_code',
      promoCode: upperCode,
      startDate: now,
      endDate,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Also update the user doc with subscription info (server-side, bypasses rules)
    const userRef = db.collection('users').doc(userId);
    batch.set(userRef, {
      subscription: {
        status: 'active',
        plan: 'pro',
        billingPeriod: 'annual',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        source: 'promo_code',
        promoCode: upperCode,
        createdAt: now,
        updatedAt: now,
      },
    }, { merge: true });

    await batch.commit();

    return NextResponse.json({
      success: true,
      plan: 'pro',
      subscriptionEnd: endDate.toISOString(),
      message: `Your Pro subscription is active for ${durationDays} days!`,
    });
  } catch (error: any) {
    console.error('[Promo Redeem] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
