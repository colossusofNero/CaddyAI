# Recommendation Tracking Integration Guide

This guide shows how to integrate recommendation tracking into your app (mobile or web).

## 🎯 Overview

Every time the shot optimizer runs, we track:
1. **The Recommendation** - What shots were suggested and why
2. **User's Decision** - What they actually chose
3. **The Outcome** - Where the ball landed vs. what was recommended

## 📱 Integration Scenarios

### Scenario 1: Optimizer Button Click

When the user clicks the "Optimize Shot" button:

```typescript
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';
import { recommendClubForDistance } from '@/services/recommendationService';

function OptimizerButton() {
  const { trackRecommendation } = useRecommendationTracking();
  const [currentGPS, setCurrentGPS] = useState<GPSPosition | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);

  async function handleOptimize() {
    if (!currentGPS || !currentWeather) return;

    // 1. Calculate optimal shots (your existing logic)
    const distanceToGreen = 150; // Get from GPS
    const clubs = await getUserClubs();

    const recommendations = clubs.map((club) => {
      const rec = recommendClubForDistance(
        distanceToGreen,
        [club],
        currentWeather,
        elevationChange,
        shotDirection
      );

      return {
        shotId: `shot_${club.id}_${Date.now()}`,
        clubId: club.id,
        clubName: club.name,
        shotName: 'Standard',
        takeback: 'Full',
        face: 'Square',
        carryYards: rec.adjustedDistance,
        rollYards: club.rollYards,
        totalYards: rec.adjustedDistance + club.rollYards,
        expectedValue: calculateEV(club, distanceToGreen), // Your EV logic
        adjustedCarry: rec.adjustedDistance,
        reasoning: rec.impact.recommendations.join('; '),
      };
    });

    // 2. Track the recommendation in Firebase
    const eventId = await trackRecommendation({
      roundId: currentRoundId,
      holeNumber: currentHole,
      shotNumber: currentShotNumber,
      source: 'optimizer-button', // Important: marks this as button-triggered
      gpsPosition: currentGPS,
      conditions: {
        temperature: currentWeather.temperature,
        windSpeed: currentWeather.windSpeed,
        windDirection: currentWeather.windDirection,
        humidity: currentWeather.humidity,
        elevationChange: elevationChange,
      },
      distanceToTarget: distanceToGreen,
      recommendations: recommendations,
      deviceType: 'ios', // or 'android' or 'web'
      appVersion: '1.0.0',
    });

    // 3. Store eventId to update later when user makes decision
    setCurrentRecommendationEventId(eventId);

    // 4. Show recommendations to user
    showRecommendations(recommendations);
  }

  return (
    <button onClick={handleOptimize}>
      Optimize Shot
    </button>
  );
}
```

### Scenario 2: AI Agent Generates Recommendation

When the AI agent provides shot recommendations during conversation:

```typescript
// In your AI agent's tool/function that generates recommendations

async function provideShot Recommendation(userMessage: string, context: any) {
  const { trackRecommendation, updateDecision } = useRecommendationTracking();

  // 1. Calculate recommendations (same as optimizer button)
  const recommendations = calculateOptimalShots(
    context.gpsPosition,
    context.weather,
    context.distanceToGreen
  );

  // 2. Track immediately
  const eventId = await trackRecommendation({
    roundId: context.roundId,
    holeNumber: context.holeNumber,
    shotNumber: context.shotNumber,
    source: 'ai-agent', // Important: marks this as AI-generated
    gpsPosition: context.gpsPosition,
    conditions: context.conditions,
    distanceToTarget: context.distanceToGreen,
    recommendations: recommendations,
    deviceType: context.deviceType,
    appVersion: context.appVersion,
  });

  // 3. AI presents recommendations to user
  const aiResponse = `I recommend these shots:
1. ${recommendations[0].clubName} - ${recommendations[0].totalYards} yards
2. ${recommendations[1].clubName} - ${recommendations[1].totalYards} yards

Which would you like to use?`;

  // 4. Wait for user response
  const userResponse = await waitForUserResponse();

  // 5. Parse user response and update decision
  const decision = parseUserDecision(userResponse, recommendations);

  await updateDecision({
    eventId: eventId,
    decisionType: decision.type, // 'followed-primary', 'followed-secondary', 'chose-different'
    chosenShotId: decision.shotId,
    chosenClubName: decision.clubName,
    chosenShotName: decision.shotName,
    conversationContext: {
      userResponse: userResponse,
      agentQuestion: aiResponse,
      confidence: decision.confidence, // 'high' if clear match, 'low' if uncertain
    },
  });

  return aiResponse;
}

// Helper function to parse user decision
function parseUserDecision(userResponse: string, recommendations: any[]) {
  const lower = userResponse.toLowerCase();

  // Check if user mentioned a specific club
  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    if (lower.includes(rec.clubName.toLowerCase())) {
      return {
        type: i === 0 ? 'followed-primary' : 'followed-secondary',
        shotId: rec.shotId,
        clubName: rec.clubName,
        shotName: rec.shotName,
        confidence: 'high',
      };
    }
  }

  // Check for affirmative responses (assuming they mean first recommendation)
  if (lower.match(/yes|sure|sounds good|let's do it|perfect|great/)) {
    return {
      type: 'followed-primary',
      shotId: recommendations[0].shotId,
      clubName: recommendations[0].clubName,
      shotName: recommendations[0].shotName,
      confidence: 'medium',
    };
  }

  // Check if they mentioned a different club
  const clubPattern = /(\d\w*)-?(iron|wood|hybrid|wedge|driver|putter)/i;
  const match = userResponse.match(clubPattern);
  if (match) {
    return {
      type: 'chose-different',
      clubName: match[0],
      shotName: 'Unknown',
      confidence: 'medium',
    };
  }

  // Couldn't determine
  return {
    type: 'no-decision',
    confidence: 'low',
  };
}
```

### Scenario 3: Outcome Tracking (After Shot)

Track the outcome when the next GPS position is captured or next recommendation is made:

```typescript
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';

function GPSTracker() {
  const { updateOutcome } = useRecommendationTracking();
  const [previousEventId, setPreviousEventId] = useState<string | null>(null);

  // Called when GPS position changes significantly (ball has been hit)
  async function onGPSUpdate(newPosition: GPSPosition) {
    // If we have a previous recommendation event, update its outcome
    if (previousEventId) {
      await updateOutcome({
        eventId: previousEventId,
        positionAfter: newPosition,
        // Optional: Add outcome assessment if you can determine it
        landingArea: determineLandingArea(newPosition), // 'green', 'fairway', 'rough', etc.
        outcome: assessOutcome(newPosition), // 'excellent', 'good', 'fair', 'poor'
      });
    }

    // Update for next shot
    setPreviousEventId(currentEventId);
  }

  // OR: Link to next recommendation
  async function onNextRecommendation(newEventId: string) {
    if (previousEventId) {
      await updateOutcome({
        eventId: previousEventId,
        positionAfter: currentGPS,
        nextRecommendationId: newEventId, // Links the chain of shots
      });
    }
  }

  return null; // GPS tracker component
}
```

## 🔗 Linking the Full Chain

For complete tracking, link events together:

```typescript
let previousRecommendationId: string | null = null;

// Shot 1: Tee shot
const teeEventId = await trackRecommendation({
  shotNumber: 1,
  source: 'optimizer-button',
  ...params1
});

// User hits tee shot, moves to fairway

// Shot 2: Approach shot
const approachEventId = await trackRecommendation({
  shotNumber: 2,
  source: 'ai-agent',
  ...params2
});

// Update tee shot outcome now that we have new position
await updateOutcome({
  eventId: teeEventId,
  positionAfter: currentGPS,
  nextRecommendationId: approachEventId,
  landingArea: 'fairway',
  outcome: 'good',
});
```

## 📊 Firebase Data Structure

Your data will be stored as:

```
/recommendations
  /{userId}
    /events
      /rec_abcd1234_1234567890_xyz
        - id: "rec_abcd1234_1234567890_xyz"
        - userId: "user123"
        - roundId: "round_abc"
        - holeNumber: 5
        - shotNumber: 2
        - timestamp: Timestamp
        - source: "ai-agent"
        - gpsPosition: {...}
        - conditions: {...}
        - distanceToTarget: 150
        - recommendations: [...]
        - userDecision: {...}  // Added later
        - outcome: {...}        // Added later
        - createdAt: Timestamp
        - updatedAt: Timestamp

    /meta
      /stats
        - totalRecommendations: 47
        - fromAIAgent: 32
        - fromButton: 15
        - followedPrimary: 28
        - followedSecondary: 12
        - adherenceRate: 85.1
        - ...
```

## 🎨 UI Integration Examples

### Show Recent Recommendations

```typescript
function RecommendationHistory() {
  const { getRecommendations } = useRecommendationTracking();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function load() {
      const recs = await getRecommendations({ limit: 10 });
      setRecommendations(recs);
    }
    load();
  }, []);

  return (
    <div>
      <h2>Recent Recommendations</h2>
      {recommendations.map(rec => (
        <div key={rec.id}>
          <div>Hole {rec.holeNumber} - {rec.distanceToTarget} yards</div>
          <div>
            Recommended: {rec.recommendations[0].clubName}
            {rec.userDecision && (
              <span> | You chose: {rec.userDecision.chosenClubName}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Show Adherence Stats

```typescript
function AdherenceStats() {
  const { getStats } = useRecommendationTracking();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const s = await getStats();
      setStats(s);
    }
    load();
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2>Your Recommendation Stats</h2>
      <p>Total Recommendations: {stats.totalRecommendations}</p>
      <p>Followed Primary: {stats.followedPrimary}</p>
      <p>Adherence Rate: {stats.adherenceRate.toFixed(1)}%</p>
    </div>
  );
}
```

## ✅ Checklist for Integration

- [ ] Import `useRecommendationTracking` hook in your component
- [ ] Call `trackRecommendation()` every time optimizer runs
- [ ] Store the returned `eventId` for later updates
- [ ] Call `updateDecision()` when user responds/chooses
- [ ] Call `updateOutcome()` when next GPS position is captured
- [ ] Link events together using `nextRecommendationId`
- [ ] Test with both optimizer button and AI agent
- [ ] Verify data appears in Firebase console under `/recommendations/{userId}/events`

## 🚀 Next Steps

Once data is collecting:
1. Build analytics dashboard (Task #11)
2. Implement quad analysis for recommendation updates
3. Add outcome prediction models
4. Create personalized recommendation adjustments

## 📝 Notes

- **Don't worry about duplicates** - Track every optimizer run, even if user runs it multiple times
- **Sort out "real" shots later** - You mentioned having ideas for this; the data structure supports it
- **Decision tracking is optional** - If user doesn't respond, that's fine; just track the recommendation
- **Outcome tracking can be deferred** - Can add it later when implementing full GPS tracking

## ❓ Questions?

Check the type definitions in `/types/recommendationTracking.ts` for full schema details.
