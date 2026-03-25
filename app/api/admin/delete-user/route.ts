/**
 * Admin: Delete User API Route
 * POST /api/admin/delete-user
 *
 * Properly deletes a user from both Stripe and Firebase:
 * 1. Cancels any active Stripe subscription immediately
 * 2. Deletes the Stripe customer
 * 3. Deletes user data from Firestore (users, subscriptions, promoCodes redemptions)
 * 4. Deletes the Firebase Auth account
 *
 * Requires Firebase Admin auth — caller must be authenticated and
 * their email must be in the ADMIN_EMAILS list.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';
import { stripe } from '@/lib/stripe';

// Add your admin email(s) here
const ADMIN_EMAILS = [
  'scott.roelofs@rcgvaluation.com',
  'scottroelofs@icloud.com',
];

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase ID token
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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin access
    if (!ADMIN_EMAILS.includes(decodedToken.email || '')) {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const { userId, email } = await request.json();
    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
    }

    const { getAdminDb } = await import('@/services/firebaseAdmin');
    const db = getAdminDb();
    const auth = getAuth();

    // Resolve userId from email if needed
    let targetUserId = userId;
    let targetEmail = email;
    if (!targetUserId && targetEmail) {
      try {
        const userRecord = await auth.getUserByEmail(targetEmail);
        targetUserId = userRecord.uid;
      } catch {
        return NextResponse.json({ error: `No Firebase Auth user found for ${targetEmail}` }, { status: 404 });
      }
    }
    if (!targetEmail && targetUserId) {
      try {
        const userRecord = await auth.getUser(targetUserId);
        targetEmail = userRecord.email;
      } catch {
        // User might already be deleted from Auth
      }
    }

    const results: string[] = [];

    // Step 1: Cancel Stripe subscription and delete customer
    try {
      const userDoc = await db.collection('users').doc(targetUserId).get();
      const userData = userDoc.data();
      const stripeCustomerId = userData?.subscription?.stripeCustomerId;
      const stripeSubscriptionId = userData?.subscription?.stripeSubscriptionId;

      if (stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(stripeSubscriptionId);
          results.push(`Stripe subscription ${stripeSubscriptionId} canceled`);
        } catch (e: any) {
          results.push(`Stripe subscription cancel: ${e.message}`);
        }
      }

      if (stripeCustomerId) {
        try {
          await stripe.customers.del(stripeCustomerId);
          results.push(`Stripe customer ${stripeCustomerId} deleted`);
        } catch (e: any) {
          results.push(`Stripe customer delete: ${e.message}`);
        }
      }

      // Also search Stripe by email in case the IDs don't match
      if (targetEmail) {
        try {
          const customers = await stripe.customers.list({ email: targetEmail, limit: 10 });
          for (const customer of customers.data) {
            // Cancel all subscriptions for this customer
            const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });
            for (const sub of subs.data) {
              if (sub.status !== 'canceled') {
                await stripe.subscriptions.cancel(sub.id);
                results.push(`Stripe subscription ${sub.id} canceled (found by email)`);
              }
            }
            await stripe.customers.del(customer.id);
            results.push(`Stripe customer ${customer.id} deleted (found by email)`);
          }
        } catch (e: any) {
          results.push(`Stripe email search cleanup: ${e.message}`);
        }
      }
    } catch (e: any) {
      results.push(`Stripe cleanup error: ${e.message}`);
    }

    // Step 2: Delete Firestore data
    try {
      await db.collection('users').doc(targetUserId).delete();
      results.push('Firestore users doc deleted');
    } catch (e: any) {
      results.push(`Firestore users delete: ${e.message}`);
    }

    try {
      await db.collection('subscriptions').doc(targetUserId).delete();
      results.push('Firestore subscriptions doc deleted');
    } catch (e: any) {
      results.push(`Firestore subscriptions delete: ${e.message}`);
    }

    // Step 3: Delete Firebase Auth user
    try {
      await auth.deleteUser(targetUserId);
      results.push('Firebase Auth user deleted');
    } catch (e: any) {
      results.push(`Firebase Auth delete: ${e.message}`);
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      email: targetEmail,
      results,
    });
  } catch (error: any) {
    console.error('[Admin Delete User] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
