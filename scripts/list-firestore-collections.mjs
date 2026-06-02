import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

const db = getFirestore();

const cols = await db.listCollections();
console.log(`Found ${cols.length} top-level collections:\n`);
for (const col of cols) {
  const snap = await col.limit(1).get();
  const count = (await col.count().get()).data().count;
  console.log(`  ${col.id}  (${count} docs)`);
  if (snap.size > 0) {
    const sample = snap.docs[0].data();
    const keys = Object.keys(sample).slice(0, 10);
    console.log(`    sample keys: ${keys.join(', ')}`);
  }
}
process.exit(0);
