/**
 * Create Promo Codes in Firestore
 *
 * Usage:
 *   node scripts/create-promo-codes.js
 *
 * Requires FIREBASE_SERVICE_ACCOUNT environment variable to be set,
 * or run with: FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' node scripts/create-promo-codes.js
 *
 * You can also create a .env.local file with the variable.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

// Load .env.local if it exists
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        let value = match[2].trim();
        // Remove surrounding quotes
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        process.env[match[1].trim()] = value;
      }
    });
  }
} catch (e) {
  // ignore
}

// Initialize Firebase Admin
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is required.');
  console.error('Set it in .env.local or pass it directly.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

/**
 * Generate a promo code string like CADDY-PRO-A1B2C3D4
 */
function generateCode(prefix = 'CADDY-PRO') {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Create promo codes in Firestore
 */
async function createPromoCodes(count, options = {}) {
  const {
    prefix = 'CADDY-PRO',
    durationDays = 365,
    maxRedemptions = 1,
    type = 'subscription',
  } = options;

  const codes = [];
  const batch = db.batch();

  for (let i = 0; i < count; i++) {
    const code = generateCode(prefix);
    const ref = db.collection('promoCodes').doc(code);

    const data = {
      code,
      type,
      durationDays,
      maxRedemptions,
      currentRedemptions: 0,
      active: true,
      createdAt: new Date(),
      expiresAt: null, // null = never expires
    };

    batch.set(ref, data);
    codes.push(code);
  }

  await batch.commit();
  return codes;
}

// --- Main ---
async function main() {
  const count = parseInt(process.argv[2] || '5', 10);
  const durationDays = parseInt(process.argv[3] || '365', 10);

  console.log(`Creating ${count} promo codes (${durationDays}-day subscriptions)...\n`);

  const codes = await createPromoCodes(count, { durationDays });

  console.log('Created promo codes:\n');
  codes.forEach(code => {
    console.log(`  ${code}`);
    console.log(`    QR URL: https://copperlinegolf.com/redeem?code=${code}`);
    console.log('');
  });

  console.log(`\nAll ${count} codes written to Firestore (promoCodes collection).`);
  console.log('Each code can be redeemed once for a ' + durationDays + '-day Pro subscription.');

  process.exit(0);
}

main().catch(err => {
  console.error('Failed to create promo codes:', err);
  process.exit(1);
});
