# Storage System Unification Plan

## Current State (Problematic)

We have **two separate storage systems** for golf rounds:

### Mobile App → `scores` Collection
- **Collection**: `scores`
- **Schema**: Full `FirebaseScore` type
- **Includes**:
  - Complete hole-by-hole data
  - Course and tee information
  - Stats (fairways, greens, putts)
  - GHIN posting status
  - Timestamps

### Web App → `rounds` Collection
- **Collection**: `rounds`
- **Schema**: Simplified `Round` type
- **Includes**:
  - Basic hole scores
  - Course name
  - Date and score
  - Less detailed than mobile

## Problem

- Data is split across two collections
- Different schemas make analysis difficult
- Mobile and web don't see each other's data correctly
- Duplication and inconsistency

## Solution: Unified `scores` Collection

**Decision**: Use the mobile app's `scores` collection as the single source of truth.

### Why `scores` over `rounds`?
1. ✅ More comprehensive schema
2. ✅ Includes GHIN integration
3. ✅ Better hole-by-hole tracking
4. ✅ Already used by mobile app (majority of users)
5. ✅ Supports handicap calculations
6. ✅ Has proper tee/course data

## Migration Steps

### Phase 1: Update Web App Writes (Immediate)

**File**: `lib/api/rounds.ts`

Change `createRound()` to write to `scores` collection instead of `rounds`:

```typescript
async createRound(request: CreateRoundRequest): Promise<Round> {
  // Map Round format to FirebaseScore format
  const firebaseScore: FirebaseScore = {
    id: '',
    userId: this.getCurrentUserId(),
    date: request.date,
    startTime: request.date,
    roundType: '18', // or detect from holes length
    course: {
      id: request.courseId,
      name: request.courseName,
    },
    tee: {
      // Default tee data or get from request
      id: 'default',
      name: 'White',
      color: 'White',
      gender: 'M',
      rating: 71.5,
      slope: 125,
      yardage: 6500,
      par: 72,
    },
    holes: request.holes.map(hole => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      handicapIndex: hole.holeNumber,
      yardage: hole.yardage || 400,
      strokes: hole.score || 0,
      adjustedStrokes: hole.score || 0,
      putts: hole.putts || 0,
      penalties: 0,
      fairwayHit: hole.fairwayHit,
      greenInRegulation: hole.greenInRegulation,
    })),
    stats: this.calculateStats(request.holes),
    ghinStatus: {
      eligible: true,
      posted: false,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    version: 1,
  };

  // Write to 'scores' collection (NOT 'rounds')
  const createdScore = await this.createDocument<FirebaseScore>(
    'scores',  // Changed!
    firebaseScore
  );

  // Convert back to Round format for return
  return this.convertScoreToRound(createdScore);
}
```

### Phase 2: Update Read Operations (Immediate)

The `getRounds()` method already reads from both collections and merges them. This is good!

**Keep this behavior** but document it:

```typescript
async getRounds(limitCount = 50): Promise<Round[]> {
  // Already fetches from both 'rounds' (legacy) and 'scores' (current)
  // This ensures we show all historical data

  // Eventually we can remove 'rounds' fetch once migration is complete
}
```

### Phase 3: Migrate Existing Data (Optional)

Create a one-time migration script:

```typescript
// scripts/migrate-rounds-to-scores.ts
async function migrateRoundsToScores() {
  // 1. Read all from 'rounds' collection
  // 2. Convert to 'scores' format
  // 3. Write to 'scores' collection
  // 4. Delete from 'rounds' (after verification)
}
```

### Phase 4: Remove Dual System (Future)

Once all writes go to `scores`:
1. Remove `rounds` collection reads
2. Remove conversion logic
3. Simplify codebase

## Updated Architecture

```
/scores/{scoreId}
  - id: string
  - userId: string
  - date: string
  - roundType: '18' | '9-front' | '9-back'
  - course: { id, name, city, state }
  - tee: { name, color, rating, slope, yardage, par }
  - holes: HoleScore[]
  - stats: ScoreStats
  - ghinStatus: GHINStatus
  - createdAt: Timestamp
  - updatedAt: Timestamp

/activeRounds/{userId}
  - Current round in progress
  - Gets converted to /scores entry when complete

/rounds/{roundId}
  - DEPRECATED - Keep for reading legacy data only
  - No new writes go here
```

## Benefits of Unification

1. ✅ Single source of truth
2. ✅ Consistent data structure
3. ✅ Mobile and web share same data
4. ✅ Easier analytics
5. ✅ Better GHIN integration
6. ✅ Simplified codebase

## Rollout Plan

### Week 1: Update Web App
- [ ] Update `createRound()` to write to `scores`
- [ ] Update `updateRound()` to modify `scores`
- [ ] Test thoroughly
- [ ] Deploy to production

### Week 2: Verify
- [ ] Monitor Firebase writes
- [ ] Ensure no new `rounds` documents
- [ ] Verify mobile app still works
- [ ] Check data consistency

### Week 3: Migrate (Optional)
- [ ] Run migration script on production data
- [ ] Verify migrated data
- [ ] Keep `rounds` collection as backup

### Week 4: Cleanup (Future)
- [ ] Remove `rounds` collection reads
- [ ] Remove conversion code
- [ ] Update documentation

## Testing Checklist

- [ ] Create round from web → saves to `scores`
- [ ] View rounds from web → shows both legacy and new
- [ ] Mobile app rounds → appear on web
- [ ] Web app rounds → appear in mobile
- [ ] Statistics calculate correctly
- [ ] GHIN posting works
- [ ] No data loss

## Rollback Plan

If issues arise:
1. Revert web app to write to `rounds` again
2. Keep both collections active
3. Fix issues
4. Retry migration

## Questions?

See type definitions:
- `/types/scores.ts` - Firebase score schema
- `/lib/api/types.ts` - API types
