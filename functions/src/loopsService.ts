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

export type LoopsContactProperties = {
  firstName?: string;
  lastName?: string;
  userId?: string;
  signupSource?: 'organic' | 'qr' | 'promo';
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
