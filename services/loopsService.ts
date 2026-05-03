/**
 * Loops.so contact upserts (server-side).
 *
 * Wraps the Loops contacts/update endpoint, which is documented as an upsert:
 * creates the contact if it doesn't exist, updates it if it does. All calls
 * are best-effort — failures are logged but never thrown, so a Loops outage
 * cannot break signup, redemption, or profile-save flows.
 *
 * Uses the LOOPS_API_KEY env var (server-only, never NEXT_PUBLIC_*).
 */

import 'server-only';

const LOOPS_API_BASE = 'https://app.loops.so/api/v1';

export type LoopsSignupSource = 'organic' | 'qr' | 'promo';

export type LoopsContactProperties = {
  firstName?: string;
  lastName?: string;
  userId?: string;
  signupSource?: LoopsSignupSource;
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

/**
 * Create or update a Loops contact. Returns true on success, false otherwise.
 * Never throws — Loops failures must never block user-facing flows.
 */
export async function upsertLoopsContact(
  email: string | null | undefined,
  properties: LoopsContactProperties = {}
): Promise<boolean> {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.warn('[Loops] LOOPS_API_KEY not configured — skipping contact upsert');
    return false;
  }
  if (!email) {
    console.warn('[Loops] No email provided — skipping contact upsert');
    return false;
  }

  // Strip nullish/empty values so we never blank out fields already set in Loops.
  const payload: Record<string, string | number | boolean> = { email };
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value as string | number | boolean;
    }
  }

  try {
    const res = await fetch(`${LOOPS_API_BASE}/contacts/update`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[Loops] Upsert failed:', res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Loops] Upsert error (non-blocking):', err);
    return false;
  }
}
