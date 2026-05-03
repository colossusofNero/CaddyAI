/**
 * Client-side Loops helper.
 *
 * Browser code can't talk to the Loops API directly (the key is server-only),
 * so this calls our internal /api/loops/upsert proxy instead. The proxy verifies
 * the Firebase ID token, then forwards to Loops with the verified email.
 *
 * Best-effort by design — failures are logged but never thrown.
 */

import { auth } from '@/lib/firebase';

export type LoopsClientProperties = {
  firstName?: string;
  lastName?: string;
  signupSource?: 'organic' | 'qr' | 'promo';
  promoCode?: string;
  profileComplete?: boolean;
  onboardingComplete?: boolean;
  clubsComplete?: boolean;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  trialEndDate?: string;
  handicap?: number;
  skillLevel?: string;
  playFrequency?: string;
  yearsPlaying?: number;
  dominantHand?: string;
  naturalShot?: string;
  shotHeight?: string;
  [key: string]: string | number | boolean | undefined | null;
};

export async function notifyLoops(properties: LoopsClientProperties): Promise<void> {
  try {
    if (!auth?.currentUser) return;
    const idToken = await auth.currentUser.getIdToken();
    await fetch('/api/loops/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ properties }),
    });
  } catch (err) {
    console.error('[Loops] Client notify failed (non-blocking):', err);
  }
}
