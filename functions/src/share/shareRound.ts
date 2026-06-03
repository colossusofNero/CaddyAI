import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { upsertLoopsContact, sendLoopsTransactional } from '../loopsService';

if (admin.apps.length === 0) admin.initializeApp();

// Light per-user rate limit: how many sends a single user can do in a window.
const RATE_LIMIT = { count: 20, windowMs: 24 * 60 * 60 * 1000 };

interface ShareRoundRequest {
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  course: {
    name: string;
    date: string; // YYYY-MM-DD
  };
  score: {
    total: number;
    par: number;
  };
  shotsPlotted: number;
  // Optional override (e.g. "Scottsdale, AZ") shown on the email
  courseLocation?: string;
}

interface ShareRoundResponse {
  sent: boolean;
  detail?: string;
}

async function checkRateLimit(uid: string): Promise<boolean> {
  const fs = admin.firestore();
  const ref = fs.collection('shareRoundUsage').doc(uid);
  const now = Date.now();
  const cutoff = now - RATE_LIMIT.windowMs;
  const snap = await ref.get();
  const recent: number[] = snap.exists ? (snap.data()?.timestamps ?? []) : [];
  const inWindow = recent.filter(t => t > cutoff);
  if (inWindow.length >= RATE_LIMIT.count) return false;
  inWindow.push(now);
  await ref.set({ timestamps: inWindow.slice(-50), updatedAt: now });
  return true;
}

export const sendShareRoundEmailFn = functions
  .runWith({ secrets: ['LOOPS_API_KEY', 'LOOPS_SHARE_ROUND_TXN_ID'] })
  .https.onCall(async (data: ShareRoundRequest, context): Promise<ShareRoundResponse> => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    if (!data?.recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.recipientEmail)) {
      throw new functions.https.HttpsError('invalid-argument', 'Valid recipientEmail required');
    }
    if (!data.course?.name || !data.course?.date) {
      throw new functions.https.HttpsError('invalid-argument', 'course.name + course.date required');
    }

    const transactionalId = process.env.LOOPS_SHARE_ROUND_TXN_ID;
    if (!transactionalId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Server is not configured to send share emails (LOOPS_SHARE_ROUND_TXN_ID missing).'
      );
    }

    // Rate limit
    const ok = await checkRateLimit(context.auth.uid);
    if (!ok) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `You've hit today's share limit (${RATE_LIMIT.count} per 24h). Try again tomorrow.`
      );
    }

    // Sender info
    const sender = await admin.auth().getUser(context.auth.uid);
    const senderName =
      sender.displayName ?? sender.email?.split('@')[0] ?? 'A CopperLine golfer';
    const senderEmail = sender.email ?? '';

    // Upsert recipient into Loops with referral attribution so the user can
    // segment + send follow-up marketing from Loops.
    await upsertLoopsContact(data.recipientEmail, {
      firstName: data.recipientName ? data.recipientName.split(' ')[0] : undefined,
      lastName: data.recipientName ? data.recipientName.split(' ').slice(1).join(' ') : undefined,
      signupSource: 'shared-round',
      referralSource: 'shared-round',
      referredBy: senderName,
      referredByEmail: senderEmail,
    });

    // Build the transactional payload. Keys must match {{placeholders}} in
    // the Loops template. Values are coerced to primitives.
    const overUnder = data.score.total - data.score.par;
    const overUnderStr = overUnder >= 0 ? `+${overUnder}` : `${overUnder}`;
    const ctaUrl = 'https://copperlinegolf.com/?utm_source=loops&utm_medium=email&utm_campaign=shared-round';

    const result = await sendLoopsTransactional(
      data.recipientEmail,
      transactionalId,
      {
        senderName,
        senderEmail,
        recipientName: data.recipientName ?? '',
        courseName: data.course.name,
        courseDate: data.course.date,
        courseLocation: data.courseLocation ?? '',
        scoreTotal: data.score.total,
        scorePar: data.score.par,
        scoreOverUnder: overUnderStr,
        shotsPlotted: data.shotsPlotted,
        message: data.message ?? '',
        ctaUrl,
      }
    );

    if (!result.ok) {
      throw new functions.https.HttpsError(
        'internal',
        `Loops send failed${result.status ? ` (HTTP ${result.status})` : ''}: ${result.error ?? 'unknown'}`
      );
    }

    console.log(`[shareRound] ${context.auth.uid} → ${data.recipientEmail}`);
    return { sent: true };
  });
