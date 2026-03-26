/**
 * export-promo-codes.js
 *
 * Exports promo codes from Firestore to CSV for QR code generation.
 *
 * Usage:
 *   node scripts/export-promo-codes.js poker-chip
 *   node scripts/export-promo-codes.js digital
 *   node scripts/export-promo-codes.js          (exports all unused codes)
 *
 * Output: promo-codes-{batch}-{date}.csv
 *
 * CSV columns: code, redemption_url, batch, used
 *
 * Feed the redemption_url column into any QR code batch generator.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const FIREBASE_PROJECT_ID = 'caddyai-golf';
const BASE_URL = 'https://www.copperlinegolf.com/redeem?code=';

async function main() {
  const batchFilter = process.argv[2] || null;

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  }

  const db = admin.firestore();
  let query = db.collection('promoCodes').where('used', '==', false);

  if (batchFilter) {
    query = query.where('batch', '==', batchFilter);
  }

  console.log(`Fetching codes${batchFilter ? ` for batch: ${batchFilter}` : ''}...`);
  const snap = await query.get();

  if (snap.empty) {
    console.log('No codes found.');
    return;
  }

  const rows = ['code,redemption_url,batch,used'];
  snap.forEach((doc) => {
    const d = doc.data();
    const url = `${BASE_URL}${d.code}`;
    rows.push(`${d.code},${url},${d.batch},${d.used}`);
  });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `promo-codes-${batchFilter || 'all'}-${dateStr}.csv`;
  const outPath = path.join(__dirname, '..', filename);

  fs.writeFileSync(outPath, rows.join('\n'), 'utf8');

  console.log(`✅ Exported ${snap.size} codes to: ${filename}`);
  console.log(`\nEach QR code should encode the redemption_url column.`);
  console.log(`Example URL: ${BASE_URL}COPPER-PRO-ABCD1234`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
