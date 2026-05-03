/**
 * Loops Contact Upsert API Route
 * POST /api/loops/upsert
 *
 * Auth-protected proxy: verifies the caller's Firebase ID token, then forwards
 * to Loops with the *verified* email + uid. We never trust an email passed by
 * the client — that would let anyone overwrite anyone else's Loops contact.
 *
 * Body: { properties?: { signupSource?, profileComplete?, handicap?, ... } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';
import { upsertLoopsContact, type LoopsContactProperties } from '@/services/loopsService';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 });
    }

    initializeFirebaseAdmin();
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 });
    }

    const email = decodedToken.email;
    if (!email) {
      return NextResponse.json({ ok: false, message: 'No email on token' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const incoming: LoopsContactProperties = (body?.properties as LoopsContactProperties) || {};
    const properties: LoopsContactProperties = {
      ...incoming,
      userId: decodedToken.uid,
    };

    const ok = await upsertLoopsContact(email, properties);
    return NextResponse.json({ ok });
  } catch (error: any) {
    console.error('[Loops API] Error:', error);
    return NextResponse.json(
      { ok: false, message: error?.message || 'Failed' },
      { status: 500 }
    );
  }
}
