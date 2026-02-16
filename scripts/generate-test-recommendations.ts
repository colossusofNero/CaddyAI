/**
 * Generate Test Recommendation Data
 *
 * Creates sample recommendation events to test the dashboard
 *
 * Usage:
 * npx ts-node scripts/generate-test-recommendations.ts YOUR_USER_ID
 */

import { recommendationTrackingService } from '../services/recommendationTrackingService';
import type { GPSPosition, ConditionsSnapshot } from '../types/recommendationTracking';

// Sample GPS positions (generic golf course)
const samplePositions: GPSPosition[] = [
  { latitude: 35.9132, longitude: -79.0558, accuracy: 5, timestamp: Date.now() }, // Hole 1 tee
  { latitude: 35.9140, longitude: -79.0565, accuracy: 5, timestamp: Date.now() }, // Hole 1 fairway
  { latitude: 35.9145, longitude: -79.0570, accuracy: 5, timestamp: Date.now() }, // Hole 1 green
  { latitude: 35.9150, longitude: -79.0575, accuracy: 5, timestamp: Date.now() }, // Hole 2 tee
  { latitude: 35.9155, longitude: -79.0580, accuracy: 5, timestamp: Date.now() }, // Hole 2 fairway
];

// Sample weather conditions
const sampleConditions: ConditionsSnapshot[] = [
  {
    temperature: 72,
    windSpeed: 8,
    windDirection: 180,
    humidity: 55,
    conditions: 'Sunny',
    elevationChange: 0,
  },
  {
    temperature: 75,
    windSpeed: 12,
    windDirection: 270,
    humidity: 60,
    conditions: 'Partly Cloudy',
    elevationChange: 10,
  },
  {
    temperature: 68,
    windSpeed: 5,
    windDirection: 90,
    humidity: 50,
    conditions: 'Clear',
    elevationChange: -5,
  },
];

// Sample clubs
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

// Decision types
const decisionTypes: Array<'followed-primary' | 'followed-secondary' | 'chose-different' | 'no-decision'> = [
  'followed-primary',
  'followed-primary',
  'followed-primary',
  'followed-secondary',
  'chose-different',
  'no-decision',
];

// Outcomes
const outcomes: Array<'excellent' | 'good' | 'fair' | 'poor'> = [
  'excellent',
  'good',
  'good',
  'fair',
  'poor',
];

const landingAreas: Array<'green' | 'fairway' | 'rough' | 'bunker' | 'water'> = [
  'green',
  'fairway',
  'fairway',
  'rough',
  'bunker',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getOptimalClubForDistance(distance: number): typeof clubs[number] {
  // Find closest club
  return clubs.reduce((closest, club) => {
    const currentDiff = Math.abs(club.baseDistance - distance);
    const closestDiff = Math.abs(closest.baseDistance - distance);
    return currentDiff < closestDiff ? club : closest;
  });
}

async function generateTestData(userId: string, count: number = 10) {
  console.log(`Generating ${count} test recommendations for user ${userId}...`);

  const eventIds: string[] = [];
  const roundId = `round_test_${Date.now()}`;

  for (let i = 0; i < count; i++) {
    const holeNumber = (i % 9) + 1;
    const shotNumber = Math.floor(i / 9) + 1;
    const distance = 100 + Math.floor(Math.random() * 150); // 100-250 yards
    const source = Math.random() > 0.5 ? 'optimizer-button' : 'ai-agent';

    // Get optimal club
    const optimalClub = getOptimalClubForDistance(distance);
    const secondBestClub = getOptimalClubForDistance(distance + 10);
    const thirdBestClub = getOptimalClubForDistance(distance - 10);

    // Create recommendation
    try {
      const event = await recommendationTrackingService.createRecommendation({
        userId,
        roundId,
        holeNumber,
        shotNumber,
        source: source as any,
        gpsPosition: getRandomElement(samplePositions),
        conditions: getRandomElement(sampleConditions),
        distanceToTarget: distance,
        recommendations: [
          {
            shotId: `shot_${optimalClub.id}_${i}_1`,
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
            shotId: `shot_${secondBestClub.id}_${i}_2`,
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
            reasoning: `Alternative option with similar distance`,
          },
          {
            shotId: `shot_${thirdBestClub.id}_${i}_3`,
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
            reasoning: `Controlled shot option for windy conditions`,
          },
        ],
        deviceType: 'web',
        appVersion: '1.0.0-test',
      });

      console.log(`✅ Created event ${i + 1}/${count}: ${event.id}`);
      eventIds.push(event.id);

      // Add decision for most events (simulate user interaction)
      if (Math.random() > 0.2) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

        const decisionType = getRandomElement(decisionTypes);
        const chosenClub = decisionType === 'followed-primary'
          ? optimalClub
          : decisionType === 'followed-secondary'
          ? secondBestClub
          : getRandomElement(clubs);

        await recommendationTrackingService.updateDecision({
          eventId: event.id,
          userId,
          decisionType,
          chosenShotId: `shot_${chosenClub.id}_${i}`,
          chosenClubName: chosenClub.name,
          chosenShotName: 'Standard',
          conversationContext: source === 'ai-agent' ? {
            userResponse: decisionType === 'followed-primary'
              ? `I'll go with the ${optimalClub.name}`
              : decisionType === 'followed-secondary'
              ? `Actually, I prefer the ${secondBestClub.name}`
              : `I'm going to use my ${chosenClub.name} instead`,
            agentQuestion: `I recommend the ${optimalClub.name} for this ${distance} yard shot. Does that work for you?`,
            confidence: decisionType === 'followed-primary' ? 'high' : 'medium',
          } : undefined,
        });

        console.log(`  📝 Added decision: ${decisionType}`);

        // Add outcome for some events
        if (Math.random() > 0.3) {
          await new Promise(resolve => setTimeout(resolve, 100));

          await recommendationTrackingService.updateOutcome({
            eventId: event.id,
            userId,
            positionAfter: getRandomElement(samplePositions),
            outcome: getRandomElement(outcomes),
            landingArea: getRandomElement(landingAreas),
          });

          console.log(`  🎯 Added outcome`);
        }
      }

      // Small delay between events
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error creating event ${i + 1}:`, error);
    }
  }

  console.log(`\n✨ Complete! Generated ${eventIds.length} recommendations.`);
  console.log(`\nView your dashboard at: http://localhost:3000/recommendations`);
  console.log(`\nEvent IDs:`);
  eventIds.forEach((id, idx) => {
    console.log(`  ${idx + 1}. ${id}`);
  });
}

// Get userId from command line args
const userId = process.argv[2];
const count = parseInt(process.argv[3] || '10');

if (!userId) {
  console.error('❌ Error: Please provide a userId');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/generate-test-recommendations.ts YOUR_USER_ID [count]');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/generate-test-recommendations.ts abc123 15');
  process.exit(1);
}

// Run
generateTestData(userId, count)
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
