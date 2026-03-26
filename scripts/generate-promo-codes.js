/**
 * generate-promo-codes.js
 *
 * Generates 2,000 unique promo codes and writes them to Firestore.
 *
 * Batches:
 *   - 1,000 "poker-chip"  (printed on poker chips with QR)
 *   - 1,000 "digital"     (sent digitally / email / social)
 *
 * Code format: COPPER-PRO-XXXXXXXX  (8 uppercase alphanumeric chars)
 *
 * Usage:
 *   node scripts/generate-promo-codes.js
 *
 * Prerequisites:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var pointing to your service account JSON
 *   - OR run from a machine already authenticated with gcloud
 *
 *   npm install firebase-admin  (if not already installed)
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// ── Config ────────────────────────────────────────────────────────────────────

const FIREBASE_PROJECT_ID = 'caddyai-golf'; // update if different
const BATCH_SIZES = {
  'poker-chip': 1000,
  'digital': 1000,
};

// Codes must be REDEEMED within 2 years of generation
const CODE_EXPIRY_DAYS = 730;

// Each redeemed code grants 365 days of Pro
const DURATION_DAYS = 365;

const PLAN = 'pro';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode() {
  // 8 chars from a 32-char alphabet (no 0/O/I/1 to avoid visual confusion)
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return `COPPER-PRO-${result}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Init Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  }

  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  let totalWritten = 0;

  for (const [batchName, count] of Object.entries(BATCH_SIZES)) {
    console.log(`\n── Generating ${count} codes for batch: ${batchName} ──`);

    const codes = new Set();
    while (codes.size < count) {
      codes.add(generateCode());
    }

    const codeArray = Array.from(codes);
    const CHUNK_SIZE = 499; // Firestore batch limit is 500 ops

    for (let i = 0; i < codeArray.length; i += CHUNK_SIZE) {
      const chunk = codeArray.slice(i, i + CHUNK_SIZE);
      const batch = db.batch();

      for (const code of chunk) {
        const ref = db.collection('promoCodes').doc(code);
        batch.set(ref, {
          code,
          // Fields the check + redeem API routes require:
          active: true,
          maxRedemptions: 1,
          currentRedemptions: 0,
          type: 'subscription',
          durationDays: DURATION_DAYS,
          expiresAt,
          createdAt: now,
          // Tracking fields (not used by API routes but useful for analytics):
          batch: batchName,   // "poker-chip" | "digital"
        });
      }

      await batch.commit();
      totalWritten += chunk.length;
      console.log(`  Written ${totalWritten} codes so far...`);

      // Slight pause between chunks to avoid rate limiting
      if (i + CHUNK_SIZE < codeArray.length) {
        await sleep(300);
      }
    }

    console.log(`  ✓ ${batchName} batch complete (${count} codes)`);
  }

  console.log(`\n✅ Done! ${totalWritten} total codes written to Firestore collection: promoCodes`);
  console.log('\nNext steps:');
  console.log('  1. Export poker-chip codes: node scripts/export-promo-codes.js poker-chip');
  console.log('  2. Generate QR codes pointing to: https://www.copperlinegolf.com/redeem?code=COPPER-PRO-XXXXXXXX');
  console.log('  3. Deploy promoRedemption Cloud Functions');
}

main().catch((err) => {
  console.error('Error generating codes:', err);
  process.exit(1);
});
