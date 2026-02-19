/**
 * Seed Firestore config/labels document with default display strings.
 * Safe to re-run — uses set with merge:true so existing overrides are preserved.
 *
 * Usage: node scripts/seed-labels.js
 * Requires FIREBASE_SERVICE_ACCOUNT env var (set in .env.local).
 */

require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;
if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is required');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

const DEFAULT_LABELS = {
  roundTypes: {
    '18': '18 Holes',
    '9-front': 'Front 9',
    '9-back': 'Back 9',
  },
  scores: {
    '-3': 'Albatross',
    '-2': 'Eagle',
    '-1': 'Birdie',
    '0': 'Par',
    '1': 'Bogey',
    '2': 'Double',
    '3': 'Triple',
  },
  scoring: {
    birdiesOrBetter: 'Birdies or Better',
    pars: 'Pars',
    bogeys: 'Bogeys',
    doubles: 'Double Bogeys or Worse',
  },
  stats: {
    fairwaysHit: 'Fairways Hit',
    greensInRegulation: 'Greens in Regulation',
    totalPutts: 'Total Putts',
    averagePuttsPerHole: 'Avg Putts/Hole',
    handicapIndex: 'Handicap Index',
    averageScore: 'Average Score',
    bestScore: 'Best Score',
    totalRounds: 'Total Rounds',
  },
  scorecard: {
    hole: 'Hole',
    par: 'Par',
    yards: 'Yards',
    score: 'Score',
    putts: 'Putts',
    fir: 'FIR',
    gir: 'GIR',
    out: 'Out',
    in: 'In',
    total: 'Total',
  },
  filters: {
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    last90: 'Last 90 Days',
    allTime: 'All Time',
  },
};

async function seedLabels() {
  console.log('\n🌱 Seeding config/labels document...\n');

  try {
    const labelsRef = db.collection('config').doc('labels');
    await labelsRef.set(DEFAULT_LABELS, { merge: true });
    console.log('✅ config/labels seeded successfully.');
    console.log('\nYou can now update individual labels in the Firebase Console');
    console.log('under Firestore > config > labels without redeploying.\n');
  } catch (error) {
    console.error('❌ Error seeding labels:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedLabels();
