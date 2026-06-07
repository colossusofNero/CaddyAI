/**
 * One-off diagnostic: print what the subscription-resolution logic actually
 * sees for a given uid. No writes.
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

const uid = process.argv[2] ?? 'ZOR4qaBeDeUQL9X7bfjUTyaTyIo2';
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

const userDoc = await db.collection('users').doc(uid).get();
const promoDoc = await db.collection('subscriptions').doc(uid).get();

console.log(`uid: ${uid}`);
console.log(`users/${uid} exists: ${userDoc.exists}`);
if (userDoc.exists) {
  const data = userDoc.data();
  console.log('  has .subscription:', !!data?.subscription);
  if (data?.subscription) {
    const s = data.subscription;
    console.log('    status:', s.status);
    console.log('    plan:', s.plan);
    const end = s.currentPeriodEnd?.toDate?.() ?? s.currentPeriodEnd;
    console.log('    currentPeriodEnd:', end);
  }
}
console.log(`subscriptions/${uid} exists: ${promoDoc.exists}`);
if (promoDoc.exists) {
  const data = promoDoc.data();
  console.log('  status:', data.status);
  console.log('  plan:', data.plan);
  console.log('  source:', data.source);
  const end = data.currentPeriodEnd?.toDate?.() ?? data.currentPeriodEnd ?? data.endDate;
  console.log('  end:', end);
  console.log('  end in future?', new Date(end) > new Date());
}
