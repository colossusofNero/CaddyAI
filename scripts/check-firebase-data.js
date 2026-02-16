/**
 * Check Firebase Data
 * Verifies what data exists in Firebase
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caddyai-aaabd',
  });
}

const db = admin.firestore();

async function checkData(userIdOrEmail) {
  let userId = userIdOrEmail;

  // Convert email to userId if needed
  if (userIdOrEmail.includes('@')) {
    const userRecord = await admin.auth().getUserByEmail(userIdOrEmail);
    userId = userRecord.uid;
    console.log(`📧 Email: ${userIdOrEmail}`);
    console.log(`🆔 User ID: ${userId}\n`);
  }

  console.log('🔍 Checking Firebase data...\n');

  // Check recommendations collection
  console.log('1️⃣ Checking /recommendations collection:');
  const recDoc = await db.collection('recommendations').doc(userId).get();
  console.log(`   Document exists: ${recDoc.exists}`);
  if (recDoc.exists) {
    console.log(`   Data:`, recDoc.data());
  }

  // Check events subcollection
  console.log('\n2️⃣ Checking /recommendations/{userId}/events:');
  const eventsSnapshot = await db.collection('recommendations').doc(userId).collection('events').get();
  console.log(`   Total events: ${eventsSnapshot.size}`);

  if (eventsSnapshot.size > 0) {
    console.log('\n   📝 Sample events:');
    eventsSnapshot.docs.slice(0, 3).forEach((doc, idx) => {
      const data = doc.data();
      console.log(`   ${idx + 1}. ${doc.id}`);
      console.log(`      - Source: ${data.source}`);
      console.log(`      - Hole: ${data.holeNumber}`);
      console.log(`      - Distance: ${data.distanceToTarget} yards`);
      console.log(`      - Recommendations: ${data.recommendations?.length || 0}`);
      console.log(`      - Has decision: ${!!data.userDecision}`);
      console.log(`      - Has outcome: ${!!data.outcome}`);
    });
  }

  // Check stats
  console.log('\n3️⃣ Checking /recommendations/{userId}/meta/stats:');
  const statsDoc = await db.collection('recommendations').doc(userId).collection('meta').doc('stats').get();
  console.log(`   Stats exist: ${statsDoc.exists}`);
  if (statsDoc.exists) {
    console.log(`   Stats:`, statsDoc.data());
  }

  // List all event IDs
  if (eventsSnapshot.size > 0) {
    console.log('\n4️⃣ All event IDs:');
    eventsSnapshot.docs.forEach((doc, idx) => {
      console.log(`   ${idx + 1}. ${doc.id}`);
    });
  }

  // Check if data is readable with client SDK rules
  console.log('\n5️⃣ Checking Firestore rules:');
  console.log(`   The dashboard uses client SDK which requires:`);
  console.log(`   - User must be authenticated`);
  console.log(`   - User ID in query must match authenticated user`);
  console.log(`   - Rules must allow read access`);

  console.log('\n✅ Data check complete!');
}

const userIdOrEmail = process.argv[2] || 'scott.roelofs@rcgvaluation.com';

checkData(userIdOrEmail)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
