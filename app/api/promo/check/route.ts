/**
 * Check Promo Code API Route
 * POST /api/promo/check
 *
 * Validates a promo code exists, is active, and has redemptions remaining.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase ID token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ valid: false, reason: 'Not authenticated' }, { status: 401 });
    }

    initializeFirebaseAdmin();
    try {
      await getAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ valid: false, reason: 'Invalid token' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ valid: false, reason: 'No code provided' }, { status: 400 });
    }

    const { getAdminDb } = await import('@/services/firebaseAdmin');
    const db = getAdminDb();

    // Look up promo code
    const promoRef = db.collection('promoCodes').doc(code.toUpperCase());
    const promoDoc = await promoRef.get();

    if (!promoDoc.exists) {
      return NextResponse.json({ valid: false, reason: 'Invalid promo code' });
    }

    const promo = promoDoc.data()!;

    if (!promo.active) {
      return NextResponse.json({ valid: false, reason: 'This code is no longer active' });
    }

    if (promo.maxRedemptions > 0 && promo.currentRedemptions >= promo.maxRedemptions) {
      return NextResponse.json({ valid: false, reason: 'This code has been fully redeemed' });
    }

    if (promo.expiresAt && promo.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ valid: false, reason: 'This code has expired' });
    }

    return NextResponse.json({
      valid: true,
      type: promo.type || 'subscription',
      duration: promo.durationDays || 365,
      message: `This code grants ${promo.durationDays || 365} days of Copperline Golf Pro!`,
    });
  } catch (error: any) {
    console.error('[Promo Check] Error:', error);
    return NextResponse.json(
      { valid: false, reason: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
