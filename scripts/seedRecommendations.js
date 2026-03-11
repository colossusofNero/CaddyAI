/**
 * Seed script — sample recommendation events for scott.roelofs@rcgvaluation.com
 * Run: node scripts/seedRecommendations.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const USER_ID = 'ZOR4qaBeDeUQL9X7bfjUTyaTyIo2';

// Parse service account from env
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function ts(daysAgo, hoursOffset = 0) {
  return admin.firestore.Timestamp.fromMillis(now - daysAgo * DAY + hoursOffset * 3600 * 1000);
}

function evId(n) {
  return `rec_${USER_ID.slice(0, 8)}_${Date.now() - n * 13}_${Math.random().toString(36).slice(2, 7)}`;
}

// Scottsdale-area GPS coords (TPC Scottsdale Champions Course area)
const HOLES = [
  { lat: 33.6442, lng: -111.8901, distToPin: 412 }, // H1 tee
  { lat: 33.6441, lng: -111.8885, distToPin: 165 }, // H1 fairway
  { lat: 33.6455, lng: -111.8880, distToPin: 388 }, // H2 tee
  { lat: 33.6468, lng: -111.8892, distToPin: 195 }, // H3 tee
  { lat: 33.6468, lng: -111.8910, distToPin: 78  }, // H3 approach
  { lat: 33.6480, lng: -111.8895, distToPin: 352 }, // H4 tee
  { lat: 33.6495, lng: -111.8900, distToPin: 141 }, // H4 fairway
  { lat: 33.6510, lng: -111.8915, distToPin: 475 }, // H5 tee
  { lat: 33.6505, lng: -111.8925, distToPin: 220 }, // H5 fairway
];

// ── Shot library ──────────────────────────────────────────────────────────────

function makeShot(rank, clubId, clubName, carry, roll, ev, reason) {
  return {
    rank,
    shotId: `shot_${clubId}_standard`,
    clubId,
    clubName,
    shotName: 'Standard',
    takeback: 'Full',
    face: 'Square',
    carryYards: carry,
    rollYards: roll,
    totalYards: carry + roll,
    adjustedCarry: carry,
    expectedValue: ev,
    successProbability: Math.min(0.95, ev / 100 + 0.5),
    reasoning: reason,
    adjustments: { wind: -3, temperature: 2, elevation: 0, humidity: -1 },
  };
}

// Pre-built club recommendations for different scenarios
const SCENARIOS = [
  // Par 4, 412y — tee shot
  {
    source: 'ai-agent',
    distanceToTarget: 412,
    holeNumber: 1,
    shotNumber: 1,
    recs: [
      makeShot(1, 'club_driver', 'Driver', 268, 18, 87, 'Best distance into the fairway. Wind is left-to-right, aim at the left bunker.'),
      makeShot(2, 'club_3w', '3W', 242, 15, 79, 'Conservative option — keeps the ball in play short of the fairway bunker.'),
    ],
  },
  // Par 4, 165y — approach
  {
    source: 'ai-agent',
    distanceToTarget: 165,
    holeNumber: 1,
    shotNumber: 2,
    recs: [
      makeShot(1, 'club_7i', '7i', 158, 6, 83, 'Pin is back-left. 7i lands on center of green, should release toward pin.'),
      makeShot(2, 'club_6i', '6i', 168, 7, 76, 'Can fly directly to the flag but risks going long and into the bunker.'),
    ],
  },
  // Par 3, 195y — tee
  {
    source: 'optimizer-button',
    distanceToTarget: 195,
    holeNumber: 3,
    shotNumber: 1,
    recs: [
      makeShot(1, 'club_5i', '5i', 188, 8, 81, 'Into 12 mph headwind. 5i plays 195y effective with the wind. Aim at the center.'),
      makeShot(2, 'club_4h', '4H', 203, 10, 74, 'Slight club-up option. Carries the front bunker comfortably.'),
    ],
  },
  // Par 4, 78y — wedge approach
  {
    source: 'ai-agent',
    distanceToTarget: 78,
    holeNumber: 3,
    shotNumber: 2,
    recs: [
      makeShot(1, 'club_56', '56° (SW)', 78, 3, 90, 'Full 56° is your bread-and-butter from this range. Pin is middle of green.'),
      makeShot(2, 'club_52', '52° (GW)', 82, 4, 82, 'Take a bit off and let it run. Leaves a downhill birdie putt.'),
    ],
  },
  // Par 5, 352y — tee
  {
    source: 'ai-agent',
    distanceToTarget: 352,
    holeNumber: 4,
    shotNumber: 1,
    recs: [
      makeShot(1, 'club_driver', 'Driver', 271, 19, 88, 'Reachable par 5. Full driver leaves 75–80y in with the breeze.'),
      makeShot(2, 'club_3w', '3W', 245, 14, 80, 'Plays safe over the left hazard, leaves a full wedge in.'),
    ],
  },
  // Par 5, 141y — lay-up position approach
  {
    source: 'ai-agent',
    distanceToTarget: 141,
    holeNumber: 4,
    shotNumber: 3,
    recs: [
      makeShot(1, 'club_9i', '9i', 138, 5, 85, 'Stock 9i from 141y. Pin is front-right, land on the front edge.'),
      makeShot(2, 'club_8i', '8i', 148, 5, 77, 'Could fly past the hole on the sloped green. Stick with the 9i.'),
    ],
  },
  // Par 5, 220y second shot — lay-up
  {
    source: 'optimizer-button',
    distanceToTarget: 220,
    holeNumber: 5,
    shotNumber: 2,
    recs: [
      makeShot(1, 'club_5i', '5i', 188, 8, 82, 'Lay up to 100y for a comfortable pitching wedge. Avoids the creek at 210y.'),
      makeShot(2, 'club_3w', '3W', 243, 14, 71, 'Going for it risks the creek — low probability shot given the wind.'),
    ],
  },
];

// Decision outcomes to cycle through realistically
const DECISIONS = [
  { decisionType: 'followed-primary', chosenClubName: null, note: null },
  { decisionType: 'followed-primary', chosenClubName: null, note: null },
  { decisionType: 'followed-primary', chosenClubName: null, note: null },
  { decisionType: 'followed-secondary', chosenClubName: null, note: 'Playing it safe' },
  { decisionType: 'followed-primary', chosenClubName: null, note: null },
  { decisionType: 'chose-different', chosenClubName: 'Pitching Wedge', note: 'Felt more comfortable' },
  { decisionType: 'followed-primary', chosenClubName: null, note: null },
  { decisionType: 'followed-primary', chosenClubName: null, note: null },
  { decisionType: 'chose-different', chosenClubName: '8i', note: 'Wind picked up' },
  { decisionType: 'followed-secondary', chosenClubName: null, note: 'Conservative play' },
];

const OUTCOMES = [
  { outcome: 'excellent', landingArea: 'green' },
  { outcome: 'good',      landingArea: 'fairway' },
  { outcome: 'good',      landingArea: 'green' },
  { outcome: 'fair',      landingArea: 'rough' },
  { outcome: 'excellent', landingArea: 'fairway' },
  { outcome: 'good',      landingArea: 'fairway' },
  { outcome: 'fair',      landingArea: 'rough' },
  { outcome: 'excellent', landingArea: 'green' },
  { outcome: 'poor',      landingArea: 'bunker' },
  { outcome: 'good',      landingArea: 'green' },
];

// ── Build events across ~30 days ──────────────────────────────────────────────

async function seed() {
  const eventsRef = db.collection('recommendations').doc(USER_ID).collection('events');
  const batch = db.batch();
  const events = [];

  // Generate events spread across the last 30 days
  // 3–4 rounds, 5–7 shots each = ~20 events
  const ROUNDS = [
    { daysAgo: 2,  roundId: 'round_tpc_march9',   course: 'TPC Scottsdale Champions Course' },
    { daysAgo: 6,  roundId: 'round_lmgc_march5',  course: 'Lookout Mountain Golf Club'       },
    { daysAgo: 12, roundId: 'round_tpc_feb28',    course: 'TPC Scottsdale Champions Course' },
    { daysAgo: 20, roundId: 'round_dv_feb20',     course: 'Dove Valley Ranch Golf Club'     },
  ];

  let eventCount = 0;

  for (const round of ROUNDS) {
    // 5–6 shots per round
    const shotCount = 5 + (round.daysAgo % 2);

    for (let s = 0; s < shotCount; s++) {
      const scenario = SCENARIOS[s % SCENARIOS.length];
      const gpsBase = HOLES[s % HOLES.length];
      const decision = DECISIONS[eventCount % DECISIONS.length];
      const outcome = OUTCOMES[eventCount % OUTCOMES.length];

      const eventTs = ts(round.daysAgo, s * 0.35); // space shots ~20 min apart
      const eventId = evId(eventCount);

      const chosenClub = decision.chosenClubName ?? scenario.recs[
        decision.decisionType === 'followed-secondary' ? 1 : 0
      ].clubName;

      const event = {
        id: eventId,
        userId: USER_ID,
        roundId: round.roundId,
        holeNumber: scenario.holeNumber,
        shotNumber: scenario.shotNumber,
        timestamp: eventTs,
        source: scenario.source,

        gpsPosition: {
          latitude:  gpsBase.lat + (Math.random() - 0.5) * 0.0005,
          longitude: gpsBase.lng + (Math.random() - 0.5) * 0.0005,
          accuracy: 4 + Math.random() * 3,
          timestamp: eventTs.toMillis(),
        },

        conditions: {
          temperature: 72 + Math.round((Math.random() - 0.5) * 12),
          windSpeed: 8 + Math.round(Math.random() * 10),
          windDirection: 180 + Math.round((Math.random() - 0.5) * 60),
          humidity: 35 + Math.round(Math.random() * 25),
          conditions: ['Sunny', 'Partly Cloudy', 'Sunny', 'Clear'][eventCount % 4],
          elevationChange: Math.round((Math.random() - 0.5) * 20),
        },

        distanceToTarget: scenario.distanceToTarget + Math.round((Math.random() - 0.5) * 10),
        recommendations: scenario.recs,

        userDecision: {
          decisionType: decision.decisionType,
          timestamp: eventTs.toMillis() + 45000, // 45s after recommendation
          chosenClubName: chosenClub,
          chosenShotName: 'Standard',
          conversationContext: scenario.source === 'ai-agent' ? {
            userResponse: `I'll go with the ${chosenClub}`,
            agentQuestion: `I recommend the ${scenario.recs[0].clubName}. Which club would you like to use?`,
            confidence: 'high',
          } : undefined,
          notes: decision.note,
        },

        outcome: {
          positionBefore: {
            latitude:  gpsBase.lat,
            longitude: gpsBase.lng,
            accuracy: 4,
            timestamp: eventTs.toMillis(),
          },
          positionAfter: {
            latitude:  gpsBase.lat + (Math.random() * 0.002),
            longitude: gpsBase.lng + (Math.random() * 0.002),
            accuracy: 5,
            timestamp: eventTs.toMillis() + 120000,
          },
          actualDistanceYards: scenario.distanceToTarget - Math.round(Math.random() * 15),
          distanceToTarget: 8 + Math.round(Math.random() * 20),
          outcome: outcome.outcome,
          landingArea: outcome.landingArea,
        },

        deviceType: s % 3 === 0 ? 'android' : 'ios',
        appVersion: '2.1.4',
        createdAt: eventTs,
        updatedAt: eventTs,
      };

      batch.set(eventsRef.doc(eventId), event);
      events.push(event);
      eventCount++;
    }
  }

  await batch.commit();
  console.log(`✓ Seeded ${events.length} recommendation events for user ${USER_ID}`);

  // Also update the stats doc
  const followed = events.filter(e =>
    e.userDecision.decisionType === 'followed-primary' ||
    e.userDecision.decisionType === 'followed-secondary'
  ).length;
  const different = events.filter(e => e.userDecision.decisionType === 'chose-different').length;

  const statsRef = db.collection('recommendations').doc(USER_ID).collection('meta').doc('stats');
  await statsRef.set({
    userId: USER_ID,
    totalRecommendations: events.length,
    fromAIAgent: events.filter(e => e.source === 'ai-agent').length,
    fromButton: events.filter(e => e.source === 'optimizer-button').length,
    followedPrimary: events.filter(e => e.userDecision.decisionType === 'followed-primary').length,
    followedSecondary: events.filter(e => e.userDecision.decisionType === 'followed-secondary').length,
    choseDifferent: different,
    noDecision: 0,
    adherenceRate: Math.round((followed / events.length) * 100),
    firstRecommendation: events[events.length - 1].timestamp,
    lastRecommendation: events[0].timestamp,
    lastUpdated: admin.firestore.Timestamp.now(),
  });
  console.log(`✓ Stats doc updated — adherence rate: ${Math.round((followed / events.length) * 100)}%`);
}

seed().catch(console.error);
