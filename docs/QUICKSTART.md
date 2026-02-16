# 🚀 Quick Start Guide - Recommendation Tracking

Everything you need to get the recommendation tracking system running.

## 📋 Prerequisites

- Firebase project set up
- User authentication working
- Node.js installed

## 🔧 Setup (5 minutes)

### 1. Deploy Firebase Rules

```bash
# Deploy the updated firestore.rules
firebase deploy --only firestore:rules
```

This adds security rules for:
- `/recommendations/{userId}/events/{eventId}` - Recommendation events
- `/recommendations/{userId}/meta/stats` - User statistics
- `/scores/{scoreId}` - Unified scores collection

### 2. Verify Rules Deployed

Go to Firebase Console → Firestore → Rules tab
You should see the new rules for `recommendations` and `scores` collections.

### 3. Test with Sample Data

Generate test recommendations to see the dashboard in action:

```bash
# Replace YOUR_USER_ID with your actual Firebase user ID
npx ts-node scripts/generate-test-recommendations.ts YOUR_USER_ID 10
```

This creates 10 sample recommendations with:
- Mix of optimizer button and AI agent sources
- Various user decisions (followed, chose different, no decision)
- Outcome tracking
- Realistic golf scenarios

### 4. View Dashboard

Open your browser:
```
http://localhost:3000/recommendations
```

You should see:
- ✅ Total recommendations count
- ✅ Adherence rate percentage
- ✅ List of recommendations with decisions
- ✅ Time range filters

## 🔗 Integration Checklist

### Mobile App - Optimizer Button

**Where**: Shot optimizer button click handler

```typescript
import { recommendationTrackingService } from '@/services/recommendationTrackingService';

// When button is clicked
const eventId = await recommendationTrackingService.createRecommendation({
  userId: currentUser.uid,
  source: 'optimizer-button',
  roundId: activeRound.id,
  holeNumber: currentHole,
  shotNumber: currentShot,
  gpsPosition: {
    latitude: currentLat,
    longitude: currentLng,
    accuracy: 5,
    timestamp: Date.now(),
  },
  conditions: {
    temperature: weather.temp,
    windSpeed: weather.windSpeed,
    windDirection: weather.windDirection,
    elevationChange: elevationDelta,
  },
  distanceToTarget: distanceToGreen,
  recommendations: optimizerResults,
  deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
  appVersion: '1.0.0',
});

// Store eventId for later updates
setCurrentRecommendationId(eventId.id);
```

### Mobile App - AI Agent

**Where**: AI agent recommendation generation

```typescript
// When AI generates recommendation
const eventId = await recommendationTrackingService.createRecommendation({
  userId: currentUser.uid,
  source: 'ai-agent',
  // ... same params as above
});

// When user responds to AI
await recommendationTrackingService.updateDecision({
  eventId: eventId.id,
  userId: currentUser.uid,
  decisionType: 'followed-primary', // or 'followed-secondary', 'chose-different'
  chosenClubName: userChosenClub,
  conversationContext: {
    userResponse: userMessage,
    agentQuestion: aiQuestion,
    confidence: 'high',
  },
});
```

### Mobile App - GPS Tracking

**Where**: GPS position update handler

```typescript
// After shot is detected (significant position change)
if (previousRecommendationId) {
  await recommendationTrackingService.updateOutcome({
    eventId: previousRecommendationId,
    userId: currentUser.uid,
    positionAfter: {
      latitude: newLat,
      longitude: newLng,
      accuracy: 5,
      timestamp: Date.now(),
    },
    landingArea: detectLandingArea(newPosition),
    outcome: assessShotOutcome(newPosition, target),
  });
}
```

## ✅ Verification

### Check Firebase Console

1. Go to Firestore Database
2. Navigate to `/recommendations/{YOUR_USER_ID}/events`
3. Should see recommendation documents
4. Check `/recommendations/{YOUR_USER_ID}/meta/stats` for aggregated stats

### Check Web Dashboard

1. Login to web app
2. Go to `/recommendations` page
3. Should see test data displayed
4. Try time range filters
5. Verify stats cards show correct numbers

### Check Mobile App

1. Open round
2. Click optimizer button
3. Check Firebase - new event should appear
4. View recommendation on web dashboard

## 🐛 Troubleshooting

### "Permission denied" errors

**Solution**: Redeploy firestore rules
```bash
firebase deploy --only firestore:rules
```

### "No data showing"

**Checklist**:
- [ ] User is logged in
- [ ] Firebase rules deployed
- [ ] Test data generated with correct userId
- [ ] Check browser console for errors
- [ ] Verify data exists in Firebase console

### "Can't generate test data"

**Solution**: Make sure TypeScript is set up
```bash
npm install -D ts-node typescript @types/node
```

### "Module not found"

**Solution**: Install dependencies
```bash
npm install firebase
```

## 📊 What to Monitor

After integration, monitor:

1. **Firebase Console** - Watch for new events being created
2. **Error logs** - Check for failed writes
3. **User stats** - Verify adherence rates calculate correctly
4. **Dashboard** - Make sure UI updates properly

## 🎯 Success Criteria

You'll know it's working when:

- ✅ Optimizer button creates events in Firebase
- ✅ AI agent conversations are tracked
- ✅ User decisions are recorded
- ✅ Dashboard shows recommendations
- ✅ Stats calculate correctly
- ✅ No permission errors

## 🚦 Go Live Checklist

Before deploying to production:

- [ ] Firebase rules deployed
- [ ] Test on dev environment
- [ ] Verify mobile app integration
- [ ] Check web dashboard works
- [ ] Test with real user accounts
- [ ] Monitor for errors
- [ ] Verify data privacy (users only see their own data)

## 📚 Next Steps

Once data is flowing:

1. **Watch the data** - Monitor for patterns
2. **Build analytics** - Implement quad analysis
3. **Improve recommendations** - Use outcome data to refine
4. **Add features** - Export, sharing, comparisons

## 💡 Tips

- Start with just optimizer button tracking
- Add AI agent tracking next
- Add GPS outcome tracking last
- Test with a few users first
- Monitor Firebase usage/costs

## 🆘 Need Help?

Check the docs:
- `/docs/RECOMMENDATION_TRACKING_INTEGRATION.md` - Detailed integration guide
- `/docs/STORAGE_UNIFICATION_PLAN.md` - Storage system info
- `/docs/IMPLEMENTATION_COMPLETE.md` - Full feature overview

---

**Ready to go!** Start by deploying Firebase rules, then add the first tracking call to your optimizer button. 🚀
