/**
 * Check Scores Collection
 */

const admin = require('firebase-admin');

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;
if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is required');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'caddyai-aaabd',
});

const db = admin.firestore();

async function checkScores() {
  console.log('\n🔍 Checking Scores Collection\n');

  try {
    const scoresSnapshot = await db.collection('scores')
      .orderBy('date', 'desc')
      .limit(20)
      .get();

    console.log(`📊 Total scores found: ${scoresSnapshot.size}\n`);

    if (scoresSnapshot.empty) {
      console.log('❌ No scores found');
      return;
    }

    scoresSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. Score Document ID: ${doc.id}`);
      console.log('─────────────────────────────────────────');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkScores();
