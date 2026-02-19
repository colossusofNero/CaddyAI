/**
 * Direct Firebase Query Script - Check Rounds Data
 * Run this with: node scripts/check-rounds.js
 */

const admin = require('firebase-admin');

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;
if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is required');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'caddyai-aaabd',
});

const db = admin.firestore();

async function checkRounds() {
  console.log('\n🔍 Checking Firebase Rounds Collection...\n');

  try {
    // Get all rounds (limit 20)
    const roundsSnapshot = await db.collection('rounds')
      .orderBy('date', 'desc')
      .limit(20)
      .get();

    console.log(`📊 Total rounds found: ${roundsSnapshot.size}\n`);

    if (roundsSnapshot.empty) {
      console.log('❌ No rounds found in Firebase!');
      console.log('\nPossible reasons:');
      console.log('1. Rounds were never saved to Firebase');
      console.log('2. Rounds are in a different Firebase project');
      console.log('3. Collection name is different (not "rounds")');
      return;
    }

    // Group rounds by userId
    const roundsByUser = {};

    roundsSnapshot.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId || 'NO_USER_ID';

      if (!roundsByUser[userId]) {
        roundsByUser[userId] = [];
      }

      roundsByUser[userId].push({
        id: doc.id,
        courseName: data.courseName,
        date: data.date,
        score: data.score,
        holesCount: data.holes?.length || 0,
        hasStartTime: !!data.startTime,
        hasCreatedAt: !!data.createdAt,
      });
    });

    // Display results grouped by user
    console.log('📋 Rounds by User ID:\n');

    Object.entries(roundsByUser).forEach(([userId, rounds]) => {
      console.log(`\n👤 User ID: ${userId}`);
      console.log(`   Rounds: ${rounds.length}`);
      console.log('   ─────────────────────────────────────────');

      rounds.forEach((round, index) => {
        console.log(`   ${index + 1}. ${round.courseName || 'Unknown Course'}`);
        console.log(`      Date: ${round.date || 'No date'}`);
        console.log(`      Score: ${round.score || 'No score'}`);
        console.log(`      Holes: ${round.holesCount}`);
        console.log(`      Has startTime: ${round.hasStartTime ? '✓' : '✗'}`);
        console.log(`      Has createdAt: ${round.hasCreatedAt ? '✓' : '✗'}`);
        console.log('');
      });
    });

    console.log('\n📝 Summary:');
    console.log(`   Total unique users: ${Object.keys(roundsByUser).length}`);
    console.log(`   Total rounds: ${roundsSnapshot.size}`);

    // Check for shots
    console.log('\n\n🔍 Checking Firebase Shots Collection...\n');

    const shotsSnapshot = await db.collection('shots')
      .limit(10)
      .get();

    console.log(`📊 Sample shots found: ${shotsSnapshot.size}`);

    if (shotsSnapshot.empty) {
      console.log('❌ No shots found in Firebase shots collection');
    } else {
      console.log('\n📋 Shots sample (first 10):');
      shotsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Shot ID: ${doc.id}`);
        console.log(`   User ID: ${data.userId || 'No userId'}`);
        console.log(`   Shots array length: ${data.shots?.length || 0}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking rounds:', error);
  }

  process.exit(0);
}

checkRounds();
