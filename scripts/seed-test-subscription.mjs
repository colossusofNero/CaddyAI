/**
 * Seed an active promo-style subscription on a test uid so the dashboard
 * crawler can bypass the /start-trial gate.
 *
 * Writes to: subscriptions/{uid}  (NOT users/{uid}.subscription)
 * Tag: source='audit-test-seed' so it's grep-able and revertable.
 *
 * Usage:
 *   node scripts/seed-test-subscription.mjs [--uid <uid>] [--days 30] [--revoke]
 */

import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

const args = process.argv.slice(2);
const DEFAULT_UID = 'ZOR4qaBeDeUQL9X7bfjUTyaTyIo2';
const uid =
  (args.find(a => a.startsWith('--uid='))?.split('=')[1]) ?? DEFAULT_UID;
const days = Number(args.find(a => a.startsWith('--days='))?.split('=')[1] ?? '30');
const revoke = args.includes('--revoke');

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!sa) {
  console.error('FIREBASE_SERVICE_ACCOUNT missing from .env.local');
  process.exit(1);
}
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(sa)) });
}
const db = getFirestore();
const ref = db.collection('subscriptions').doc(uid);

if (revoke) {
  await ref.delete();
  console.log(`[seed] revoked subscriptions/${uid}`);
  process.exit(0);
}

const now = new Date();
const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

const doc = {
  status: 'active',
  plan: 'pro',
  billingPeriod: 'annual',
  currentPeriodStart: now,
  currentPeriodEnd: end,
  cancelAt: null,
  canceledAt: null,
  trialStart: null,
  trialEnd: null,
  source: 'audit-test-seed',
  promoCode: 'AUDIT-TEST',
  createdAt: now,
  updatedAt: now,
};

await ref.set(doc, { merge: true });
console.log(`[seed] wrote subscriptions/${uid}`);
console.log(`[seed]   status=active plan=pro source=audit-test-seed`);
console.log(`[seed]   currentPeriodEnd=${end.toISOString()} (${days} days from now)`);
console.log(`[seed] revoke with: node scripts/seed-test-subscription.mjs --uid=${uid} --revoke`);
