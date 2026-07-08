/**
 * Firebase Cloud Functions entry point.
 *
 * Currently exports a single trigger:
 *   onUserCreated — fires on every Firebase Auth user creation (web, mobile,
 *   admin SDK, console) and pushes the contact to Loops as a backstop. The
 *   web app already calls Loops directly for its own signup/redeem/onboarding
 *   flows, so this is intentionally a *redundant* call that catches the
 *   paths the client doesn't cover (mobile signups, Admin SDK creates,
 *   manual creates from the Firebase console).
 *
 * The function deliberately does NOT set signupSource — the web flows
 * already set it accurately ('organic' / 'qr'), and we don't want to race
 * against them and overwrite a more specific value with a generic one.
 */

import * as functions from 'firebase-functions/v1';
import { upsertLoopsContact } from './loopsService';
import {
  reconcileHoleFn,
  reconcileHoleDemoFn,
  reconcileHoleAmbiguousDemoFn,
  onActiveRoundUpdated as onActiveRoundUpdatedFn,
} from './reconcile/function';
import { saveHoleGeometryFn } from './courseHoles/function';
import { sendShareRoundEmailFn } from './share/shareRound';
import { autoCloseRoundsFn } from './autoClose/function';

// Hole-reconciliation agent: decides which optimizer calls are real shots
// vs. exploratory, based on rules 1-6 + the user's scorecard.
export const reconcileHole = reconcileHoleFn;
export const reconcileHoleDemo = reconcileHoleDemoFn;
export const reconcileHoleAmbiguousDemo = reconcileHoleAmbiguousDemoFn;
// Auto-trigger: reconciles each hole when the scorecard marks it complete.
export const onActiveRoundUpdated = onActiveRoundUpdatedFn;
// Admin callable: persists course-hole geometry edited from the web UI.
export const saveHoleGeometry = saveHoleGeometryFn;
// Player → friend / PGA pro: sends a marketing-styled round summary email
// via Loops, upserts the recipient as a Loops contact for follow-up.
export const sendShareRoundEmail = sendShareRoundEmailFn;
// Scheduled (hourly): closes rounds abandoned >4h ago and emails the player
// their Caddy Recap; also tidies stale legacy /rounds docs.
export const autoCloseRounds = autoCloseRoundsFn;

function splitDisplayName(displayName: string | null | undefined): {
  firstName?: string;
  lastName?: string;
} {
  if (!displayName) return {};
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export const onUserCreated = functions
  .runWith({ secrets: ['LOOPS_API_KEY', 'LOOPS_TEST_ONLY_EMAILS'] })
  .auth.user()
  .onCreate(async (user) => {
    const email = user.email;
    if (!email) {
      console.log('[onUserCreated] User has no email, skipping Loops sync', user.uid);
      return;
    }

    try {
      const ok = await upsertLoopsContact(email, {
        userId: user.uid,
        ...splitDisplayName(user.displayName),
      });
      console.log(`[onUserCreated] Loops upsert ${ok ? 'ok' : 'failed'} for ${email}`);
    } catch (err) {
      // Swallow all errors — if we throw, Firebase retries the function up to
      // 7 times with exponential backoff, which is the wrong response to a
      // Loops outage. Better to log and move on; the web flow's separate
      // Loops call (or a manual import) will reconcile.
      console.error('[onUserCreated] Unexpected error (non-blocking):', err);
    }
  });
