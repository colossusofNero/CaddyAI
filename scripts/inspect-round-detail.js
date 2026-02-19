/**
 * Detailed Round Inspection Script
 * This will show the FULL structure of a round document
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

async function inspectRounds() {
  console.log('\n🔍 Detailed Round Inspection\n');

  try {
    // Get the most recent round
    const roundsSnapshot = await db.collection('rounds')
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (roundsSnapshot.empty) {
      console.log('❌ No rounds found');
      return;
    }

    const roundDoc = roundsSnapshot.docs[0];
    const roundData = roundDoc.data();

    console.log('📋 Most Recent Round Document:');
    console.log('─────────────────────────────────────────\n');
    console.log('Document ID:', roundDoc.id);
    console.log('\nFull Document Structure:');
    console.log(JSON.stringify(roundData, null, 2));

    // Check for subcollections
    console.log('\n\n🔍 Checking for subcollections under this round...\n');

    const subcollections = ['holes', 'shots', 'scorecard', 'holeScores'];

    for (const subcollectionName of subcollections) {
      const subcollectionRef = roundDoc.ref.collection(subcollectionName);
      const subcollectionSnapshot = await subcollectionRef.limit(1).get();

      if (!subcollectionSnapshot.empty) {
        console.log(`✓ Found subcollection: "${subcollectionName}"`);
        console.log(`  Documents in subcollection: checking...`);

        const allDocs = await subcollectionRef.get();
        console.log(`  Total documents: ${allDocs.size}`);

        if (allDocs.size > 0) {
          console.log(`  Sample document:`);
          const sampleDoc = allDocs.docs[0];
          console.log(`    ID: ${sampleDoc.id}`);
          console.log(`    Data:`, JSON.stringify(sampleDoc.data(), null, 6));
        }
      } else {
        console.log(`✗ No subcollection: "${subcollectionName}"`);
      }
    }

    // Check all collections for scorecard-related data
    console.log('\n\n🔍 Checking all root collections...\n');

    const possibleCollections = [
      'scorecards',
      'holeScores',
      'roundScores',
      'completedRounds',
      'userRounds',
      'roundData'
    ];

    for (const collectionName of possibleCollections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        if (!snapshot.empty) {
          console.log(`✓ Found collection: "${collectionName}"`);
          const allDocs = await db.collection(collectionName).get();
          console.log(`  Total documents: ${allDocs.size}`);

          if (allDocs.size > 0) {
            console.log(`  Sample document:`);
            const sampleDoc = allDocs.docs[0];
            console.log(`    ID: ${sampleDoc.id}`);
            console.log(`    Data:`, JSON.stringify(sampleDoc.data(), null, 6));
          }
        }
      } catch (e) {
        // Collection doesn't exist
      }
    }

    // List ALL collections at root level
    console.log('\n\n🔍 Listing ALL root-level collections...\n');
    const collections = await db.listCollections();
    console.log('All collections in database:');
    collections.forEach(collection => {
      console.log(`  - ${collection.id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

inspectRounds();
