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

// Test-mode allowlist. When LOOPS_TEST_ONLY_EMAILS is set (comma-separated),
// only those addresses get contacts synced / emails sent; everyone else is
// skipped. Clear the env var to resume normal behaviour for all users.
function emailAllowed(email: string | null | undefined): boolean {
  const allow = process.env.LOOPS_TEST_ONLY_EMAILS;
  if (!allow || allow.trim() === '*') return true; // unset or '*' = allow everyone (live)
  if (!email) return false;
  const list = allow.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

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
  if (!emailAllowed(email)) {
    console.log('[Loops] test mode (LOOPS_TEST_ONLY_EMAILS) — skipping contact upsert for', email);
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

/**
 * Send a Loops transactional email. `transactionalId` is the id Loops assigns
 * to a transactional template you build in their dashboard; `dataVariables`
 * keys must match the {{handlebars}} in that template. Best-effort — never
 * throws, so a Loops outage can't break the caller (e.g. the Stripe webhook).
 */
export async function sendLoopsTransactional(
  email: string | null | undefined,
  transactionalId: string | null | undefined,
  dataVariables: Record<string, string | number | boolean> = {}
): Promise<boolean> {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.warn('[Loops] LOOPS_API_KEY not configured — skipping transactional send');
    return false;
  }
  if (!email || !transactionalId) {
    console.warn('[Loops] email + transactionalId required — skipping transactional send');
    return false;
  }
  if (!emailAllowed(email)) {
    console.log('[Loops] test mode (LOOPS_TEST_ONLY_EMAILS) — skipping transactional send to', email);
    return false;
  }

  try {
    const res = await fetch(`${LOOPS_API_BASE}/transactional`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionalId, email, dataVariables }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[Loops] Transactional send failed:', res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Loops] Transactional send error (non-blocking):', err);
    return false;
  }
}
