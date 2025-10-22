# Quick Start: CaddyAI Data Management API

## 🚀 Getting Started

### 1. Import the API
```typescript
import {
  clubsApi,
  roundsApi,
  coursesApi,
  syncManager,
  subscribeToActiveGolfersCount,
  type Club,
  type Round,
  type UserStatistics,
} from '@/lib/api';
```

### 2. Use in React Components

#### Load User's Clubs
```typescript
'use client';

import { useEffect, useState } from 'react';
import { clubsApi, type Club } from '@/lib/api';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const userClubs = await clubsApi.getClubs();
        setClubs(userClubs);
      } catch (error) {
        console.error('Error loading clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Clubs</h1>
      {clubs.map(club => (
        <div key={club.id}>
          {club.name}: {club.carryYards} yards
        </div>
      ))}
    </div>
  );
}
```

#### Create a New Club
```typescript
const handleCreateClub = async () => {
  try {
    const newClub = await clubsApi.createClub({
      name: 'Driver',
      takeback: 'Full',
      face: 'Square',
      carryYards: 250
    });

    setClubs([...clubs, newClub]);
  } catch (error) {
    console.error('Error creating club:', error);
  }
};
```

#### Display User Statistics
```typescript
'use client';

import { useEffect, useState } from 'react';
import { roundsApi, type UserStatistics } from '@/lib/api';

export default function StatsWidget() {
  const [stats, setStats] = useState<UserStatistics | null>(null);

  useEffect(() => {
    roundsApi.calculateStatistics().then(setStats);
  }, []);

  if (!stats) return null;

  return (
    <div>
      <h2>Your Stats</h2>
      <p>Handicap: {stats.currentHandicap}</p>
      <p>Average Score: {stats.averageScore}</p>
      <p>Best Score: {stats.bestScore}</p>
      <p>Fairways Hit: {stats.fairwaysHitPercentage.toFixed(1)}%</p>
      <p>GIR: {stats.greensInRegulationPercentage.toFixed(1)}%</p>
    </div>
  );
}
```

#### Real-time Active Golfers Counter
```typescript
'use client';

import { useEffect, useState } from 'react';
import { subscribeToActiveGolfersCount } from '@/lib/api';

export default function ActiveGolfersCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToActiveGolfersCount(setCount);
    return () => unsubscribe(); // Clean up subscription
  }, []);

  return (
    <div>
      <h3>{count} Golfers Currently Playing</h3>
    </div>
  );
}
```

#### Start and Track a Round
```typescript
const handleStartRound = async () => {
  try {
    // Start a new round
    const activeRound = await roundsApi.startRound(
      'course-id',
      'Pebble Beach',
      18
    );

    // Update as you play
    await roundsApi.updateActiveRound({
      currentHole: 5,
      holes: [
        { holeNumber: 1, par: 4, score: 4 },
        { holeNumber: 2, par: 3, score: 3 },
        // ... more holes
      ]
    });

    // Complete the round
    const completedRound = await roundsApi.completeActiveRound();
    console.log('Round completed:', completedRound);
  } catch (error) {
    console.error('Error with round:', error);
  }
};
```

#### Search for Courses
```typescript
const handleSearch = async (query: string) => {
  try {
    const { courses, total, hasMore } = await coursesApi.searchCourses({
      query,
      limit: 10
    });

    setCourses(courses);
  } catch (error) {
    console.error('Error searching courses:', error);
  }
};
```

#### Add Course to Favorites
```typescript
const handleToggleFavorite = async (courseId: string) => {
  try {
    const isFav = await coursesApi.isFavorite(courseId);

    if (isFav) {
      await coursesApi.removeFavorite(courseId);
    } else {
      await coursesApi.addFavorite(courseId);
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
};
```

### 3. Offline Support (Automatic)

The sync manager automatically handles offline operations:

```typescript
// This works even when offline!
await clubsApi.createClub({
  name: 'Sand Wedge',
  takeback: 'Full',
  face: 'Square',
  carryYards: 85
});

// Operation is queued if offline
// Automatically syncs when connection is restored

// Check sync status
const status = await syncManager.getStatus();
console.log(`${status.pendingChanges} changes pending sync`);
```

### 4. Optimistic Updates

For better UX, update the UI immediately:

```typescript
import { createOptimisticUpdate } from '@/lib/api';

const handleUpdateClub = async (clubId: string, newDistance: number) => {
  // Find current club
  const currentClub = clubs.find(c => c.id === clubId);
  if (!currentClub) return;

  // Optimistically update UI
  const updatedClub = createOptimisticUpdate(currentClub, {
    carryYards: newDistance
  });
  setClubs(clubs.map(c => c.id === clubId ? updatedClub : c));

  // Sync to server
  try {
    await clubsApi.updateClubDistance(clubId, newDistance);
  } catch (error) {
    // Revert on error
    setClubs(clubs.map(c => c.id === clubId ? currentClub : c));
    console.error('Update failed:', error);
  }
};
```

### 5. Error Handling

All API methods throw `ApiError` with user-friendly messages:

```typescript
import type { ApiError } from '@/lib/api';

try {
  await clubsApi.deleteClub(clubId);
} catch (error) {
  const apiError = error as ApiError;

  // User-friendly message
  alert(apiError.message);

  // Error code for logic
  if (apiError.code === 'permission-denied') {
    // Handle permission error
  }

  // Technical details for logging
  console.error(apiError.details);
}
```

## 📚 Common Patterns

### Loading States
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await clubsApi.getClubs();
      setData(result);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);
```

### Debounced Search
```typescript
import { debounce } from '@/lib/api';

const debouncedSearch = useMemo(
  () => debounce(async (query: string) => {
    const results = await coursesApi.searchCourses({ query });
    setResults(results.courses);
  }, 300),
  []
);

// Call on input change
debouncedSearch(searchQuery);
```

### Pagination
```typescript
const [page, setPage] = useState(0);
const pageSize = 20;

const loadRounds = async () => {
  const rounds = await roundsApi.getRounds(pageSize);
  setRounds(rounds);
};

const loadMore = async () => {
  const moreRounds = await roundsApi.getRounds(pageSize);
  setRounds([...rounds, ...moreRounds]);
};
```

## 🎯 Complete Example: Club Manager

```typescript
'use client';

import { useEffect, useState } from 'react';
import { clubsApi, createOptimisticUpdate, type Club } from '@/lib/api';

export default function ClubManager() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load clubs on mount
  useEffect(() => {
    const loadClubs = async () => {
      try {
        const userClubs = await clubsApi.getClubs();
        setClubs(userClubs);
      } catch (error) {
        console.error('Error loading clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, []);

  // Create new club
  const handleCreate = async () => {
    try {
      setSaving(true);
      const newClub = await clubsApi.createClub({
        name: 'New Club',
        takeback: 'Full',
        face: 'Square',
        carryYards: 150
      });
      setClubs([...clubs, newClub]);
    } catch (error) {
      alert((error as any).message);
    } finally {
      setSaving(false);
    }
  };

  // Update club distance
  const handleUpdateDistance = async (clubId: string, distance: number) => {
    const currentClub = clubs.find(c => c.id === clubId);
    if (!currentClub) return;

    // Optimistic update
    const optimisticClub = createOptimisticUpdate(currentClub, {
      carryYards: distance
    });
    setClubs(clubs.map(c => c.id === clubId ? optimisticClub : c));

    // Sync to server
    try {
      await clubsApi.updateClubDistance(clubId, distance);
    } catch (error) {
      // Revert on error
      setClubs(clubs.map(c => c.id === clubId ? currentClub : c));
      alert((error as any).message);
    }
  };

  // Delete club
  const handleDelete = async (clubId: string) => {
    if (!confirm('Delete this club?')) return;

    // Optimistic delete
    const currentClubs = clubs;
    setClubs(clubs.filter(c => c.id !== clubId));

    try {
      await clubsApi.deleteClub(clubId);
    } catch (error) {
      // Revert on error
      setClubs(currentClubs);
      alert((error as any).message);
    }
  };

  if (loading) {
    return <div>Loading clubs...</div>;
  }

  return (
    <div>
      <h1>My Golf Clubs</h1>

      <button onClick={handleCreate} disabled={saving}>
        {saving ? 'Adding...' : 'Add Club'}
      </button>

      <div>
        {clubs.map(club => (
          <div key={club.id}>
            <h3>{club.name}</h3>
            <input
              type="number"
              value={club.carryYards}
              onChange={(e) => handleUpdateDistance(
                club.id,
                parseInt(e.target.value)
              )}
            />
            <button onClick={() => handleDelete(club.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔧 Troubleshooting

### "User not authenticated" Error
Make sure user is logged in before calling API:
```typescript
import { onAuthStateChange } from '@/services/authService';

useEffect(() => {
  const unsubscribe = onAuthStateChange((user) => {
    if (user) {
      // User is logged in, safe to call API
      loadData();
    }
  });
  return () => unsubscribe();
}, []);
```

### Offline Operations Not Syncing
Check sync status:
```typescript
const status = await syncManager.getStatus();
console.log('Pending changes:', status.pendingChanges);
console.log('Is syncing:', status.isSyncing);

// Manual sync
await syncManager.sync();
```

### Real-time Subscriptions Not Updating
Ensure proper cleanup:
```typescript
useEffect(() => {
  const unsubscribe = subscribeToActiveGolfersCount(setCount);

  // IMPORTANT: Return cleanup function
  return () => unsubscribe();
}, []); // Empty deps array
```

## 📖 Full API Reference

See [BACKEND_INTEGRATION_COMPLETE.md](./BACKEND_INTEGRATION_COMPLETE.md) for complete documentation.

## 🎉 You're Ready!

Start building amazing features with type-safe, offline-first, real-time data management!
