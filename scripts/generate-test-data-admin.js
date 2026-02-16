/**
 * Generate Test Recommendation Data (Firebase Admin Version)
 *
 * Uses Firebase Admin SDK to bypass authentication
 *
 * Usage: node scripts/generate-test-data-admin.js YOUR_USER_ID [count]
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('❌ Error: Could not parse FIREBASE_SERVICE_ACCOUNT from .env.local');
  console.error('Make sure it\'s a valid JSON string.');
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caddyai-aaabd',
  });
}

const db = admin.firestore();

// Sample data
const clubs = [
  { id: 'club_driver', name: 'Driver', baseDistance: 250 },
  { id: 'club_3w', name: '3-wood', baseDistance: 230 },
  { id: 'club_5i', name: '5-iron', baseDistance: 180 },
  { id: 'club_6i', name: '6-iron', baseDistance: 170 },
  { id: 'club_7i', name: '7-iron', baseDistance: 160 },
  { id: 'club_8i', name: '8-iron', baseDistance: 150 },
  { id: 'club_9i', name: '9-iron', baseDistance: 140 },
  { id: 'club_pw', name: 'PW', baseDistance: 120 },
  { id: 'club_sw', name: 'SW', baseDistance: 90 },
];

const decisionTypes = ['followed-primary', 'followed-primary', 'followed-primary', 'followed-secondary', 'chose-different', 'no-decision'];
const outcomes = ['excellent', 'good', 'good', 'fair', 'poor'];
const landingAreas = ['green', 'fairway', 'fairway', 'rough', 'bunker'];
const sources = ['optimizer-button', 'ai-agent'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getOptimalClub(distance) {
  return clubs.reduce((closest, club) => {
    const currentDiff = Math.abs(club.baseDistance - distance);
    const closestDiff = Math.abs(closest.baseDistance - distance);
    return currentDiff < closestDiff ? club : closest;
  });
}

async function getUserIdFromEmail(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.uid;
  } catch (error) {
    console.error(`❌ Could not find user with email: ${email}`);
    console.error('Error:', error.message);
    return null;
  }
}

async function generateEvent(userId, index, roundId) {
  const holeNumber = (index % 9) + 1;
  const shotNumber = Math.floor(index / 9) + 1;
  const distance = 100 + Math.floor(Math.random() * 150);
  const source = getRandomElement(sources);

  const optimalClub = getOptimalClub(distance);
  const secondBestClub = getOptimalClub(distance + 10);
  const thirdBestClub = getOptimalClub(distance - 10);

  const eventId = `rec_${userId.substring(0, 8).replace(/[^a-z0-9]/gi, '')}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const event = {
    id: eventId,
    userId: userId,
    roundId: roundId,
    holeNumber: holeNumber,
    shotNumber: shotNumber,
    timestamp: admin.firestore.Timestamp.now(),
    source: source,
    gpsPosition: {
      latitude: 35.9132 + (Math.random() * 0.01),
      longitude: -79.0558 + (Math.random() * 0.01),
      accuracy: 5,
      timestamp: Date.now(),
    },
    conditions: {
      temperature: 68 + Math.floor(Math.random() * 15),
      windSpeed: 5 + Math.floor(Math.random() * 10),
      windDirection: Math.floor(Math.random() * 360),
      humidity: 50 + Math.floor(Math.random() * 20),
      conditions: 'Sunny',
      elevationChange: Math.floor(Math.random() * 20) - 10,
    },
    distanceToTarget: distance,
    recommendations: [
      {
        rank: 1,
        shotId: `shot_${optimalClub.id}_${index}_1`,
        clubId: optimalClub.id,
        clubName: optimalClub.name,
        shotName: 'Standard',
        takeback: 'Full',
        face: 'Square',
        carryYards: optimalClub.baseDistance,
        rollYards: 10,
        totalYards: optimalClub.baseDistance + 10,
        expectedValue: 0.85 + Math.random() * 0.10,
        adjustedCarry: optimalClub.baseDistance + (Math.random() * 10 - 5),
        reasoning: `Optimal club for ${distance} yards with current conditions`,
      },
      {
        rank: 2,
        shotId: `shot_${secondBestClub.id}_${index}_2`,
        clubId: secondBestClub.id,
        clubName: secondBestClub.name,
        shotName: 'Standard',
        takeback: 'Full',
        face: 'Square',
        carryYards: secondBestClub.baseDistance,
        rollYards: 10,
        totalYards: secondBestClub.baseDistance + 10,
        expectedValue: 0.75 + Math.random() * 0.08,
        adjustedCarry: secondBestClub.baseDistance + (Math.random() * 10 - 5),
        reasoning: 'Alternative option with similar distance',
      },
      {
        rank: 3,
        shotId: `shot_${thirdBestClub.id}_${index}_3`,
        clubId: thirdBestClub.id,
        clubName: thirdBestClub.name,
        shotName: 'Knockdown',
        takeback: '3/4',
        face: 'Square',
        carryYards: thirdBestClub.baseDistance - 15,
        rollYards: 5,
        totalYards: thirdBestClub.baseDistance - 10,
        expectedValue: 0.70 + Math.random() * 0.05,
        adjustedCarry: thirdBestClub.baseDistance - 15 + (Math.random() * 10 - 5),
        reasoning: 'Controlled shot option for windy conditions',
      },
    ],
    deviceType: 'web',
    appVersion: '1.0.0-test',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  // Add decision for most events
  if (Math.random() > 0.2) {
    const decisionType = getRandomElement(decisionTypes);
    const chosenClub = decisionType === 'followed-primary'
      ? optimalClub
      : decisionType === 'followed-secondary'
      ? secondBestClub
      : getRandomElement(clubs);

    event.userDecision = {
      decisionType: decisionType,
      timestamp: Date.now(),
      chosenShotId: `shot_${chosenClub.id}_${index}`,
      chosenClubName: chosenClub.name,
      chosenShotName: 'Standard',
    };

    if (source === 'ai-agent') {
      event.userDecision.conversationContext = {
        userResponse: decisionType === 'followed-primary'
          ? `I'll go with the ${optimalClub.name}`
          : decisionType === 'followed-secondary'
          ? `Actually, I prefer the ${secondBestClub.name}`
          : `I'm going to use my ${chosenClub.name} instead`,
        agentQuestion: `I recommend the ${optimalClub.name} for this ${distance} yard shot. Does that work for you?`,
        confidence: decisionType === 'followed-primary' ? 'high' : 'medium',
      };
    }

    // Add outcome for some events
    if (Math.random() > 0.3) {
      event.outcome = {
        positionBefore: event.gpsPosition,
        positionAfter: {
          latitude: 35.9132 + (Math.random() * 0.01),
          longitude: -79.0558 + (Math.random() * 0.01),
          accuracy: 5,
          timestamp: Date.now(),
        },
        actualDistanceYards: distance + (Math.random() * 20 - 10),
        outcome: getRandomElement(outcomes),
        landingArea: getRandomElement(landingAreas),
      };
    }
  }

  return { eventId, event };
}

async function generateTestData(userIdOrEmail, count) {
  // Check if input is email or UID
  let userId = userIdOrEmail;
  if (userIdOrEmail.includes('@')) {
    console.log(`🔍 Looking up user ID for email: ${userIdOrEmail}`);
    userId = await getUserIdFromEmail(userIdOrEmail);
    if (!userId) {
      console.error('❌ Could not find user. Make sure the email is correct.');
      return;
    }
    console.log(`✅ Found user ID: ${userId}\n`);
  }

  console.log(`🏌️  Generating ${count} test recommendations for user: ${userId}\n`);

  const roundId = `round_test_${Date.now()}`;
  const eventIds = [];

  for (let i = 0; i < count; i++) {
    try {
      const { eventId, event } = await generateEvent(userId, i, roundId);

      // Write to Firebase (using admin SDK - bypasses security rules)
      await db.collection('recommendations').doc(userId).collection('events').doc(eventId).set(event);

      eventIds.push(eventId);

      console.log(`✅ Created event ${i + 1}/${count}: ${eventId}`);
      if (event.userDecision) {
        console.log(`   📝 Decision: ${event.userDecision.decisionType}`);
      }
      if (event.outcome) {
        console.log(`   🎯 Outcome: ${event.outcome.outcome} (${event.outcome.landingArea})`);
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`❌ Error creating event ${i + 1}:`, error.message);
    }
  }

  // Update stats
  try {
    await db.collection('recommendations').doc(userId).collection('meta').doc('stats').set({
      userId: userId,
      totalRecommendations: eventIds.length,
      fromAIAgent: eventIds.length / 2,
      fromButton: eventIds.length / 2,
      lastUpdated: admin.firestore.Timestamp.now(),
    });
    console.log(`\n📊 Updated user stats`);
  } catch (error) {
    console.error(`⚠️  Could not update stats:`, error.message);
  }

  console.log(`\n✨ Complete! Generated ${eventIds.length} recommendations.`);
  console.log(`\n🌐 View your dashboard at: http://localhost:3000/recommendations`);
  console.log(`\n📝 Event IDs:`);
  eventIds.slice(0, 5).forEach((id, idx) => {
    console.log(`   ${idx + 1}. ${id}`);
  });
  if (eventIds.length > 5) {
    console.log(`   ... and ${eventIds.length - 5} more`);
  }
}

// Get arguments
const userIdOrEmail = process.argv[2];
const count = parseInt(process.argv[3] || '10');

if (!userIdOrEmail) {
  console.error('\n❌ Error: Please provide a user ID or email\n');
  console.log('Usage:');
  console.log('  node scripts/generate-test-data-admin.js USER_ID_OR_EMAIL [count]\n');
  console.log('Examples:');
  console.log('  node scripts/generate-test-data-admin.js scott.roelofs@rcgvaluation.com 10');
  console.log('  node scripts/generate-test-data-admin.js abc123xyz456 5\n');
  process.exit(1);
}

// Run
generateTestData(userIdOrEmail, count)
  .then(() => {
    console.log('\n✅ All done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  });
