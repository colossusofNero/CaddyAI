/**
 * Loops.so contact upsert (Cloud Functions runtime).
 *
 * Self-contained copy of the same helper used in the Next.js app. Functions
 * deploy as their own Node project, so we don't try to share source across
 * the boundary. Best-effort: never throws — Firebase will retry the function
 * on uncaught errors, and we don't want a Loops outage to cause runaway
 * retries.
 */

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

export type LoopsContactProperties = {
  firstName?: string;
  lastName?: string;
  userId?: string;
  signupSource?: 'organic' | 'qr' | 'promo' | 'shared-round';
  referralSource?: string;
  referredBy?: string;
  referredByEmail?: string;
  [key: string]: string | number | boolean | undefined | null;
};

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

  // Strip nullish/empty values so we never blank out fields the web flow may
  // have already set (e.g. signupSource: 'qr' from the redeem route).
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

// Loops transactional email. The `transactionalId` is the ID Loops assigns
// to a transactional template you create in their UI. `dataVariables` keys
// must match the {{handlebars}} placeholders inside that template.
export async function sendLoopsTransactional(
  email: string,
  transactionalId: string,
  dataVariables: Record<string, string | number | boolean> = {}
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'LOOPS_API_KEY not configured' };
  }
  if (!email || !transactionalId) {
    return { ok: false, error: 'email + transactionalId required' };
  }
  if (!emailAllowed(email)) {
    console.log('[Loops] test mode (LOOPS_TEST_ONLY_EMAILS) — skipping transactional send to', email);
    return { ok: false, error: 'skipped by LOOPS_TEST_ONLY_EMAILS' };
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
      return { ok: false, status: res.status, error: body || res.statusText };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Loops] Transactional send error:', err);
    return { ok: false, error: msg };
  }
}
