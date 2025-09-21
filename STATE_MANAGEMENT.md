# State Management Strategy

## Redux Toolkit Store Structure

### Auth Slice
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  subscription: SubscriptionTier;
  loading: boolean;
  error: string | null;
}
```

### Profile Slice
```typescript
interface ProfileState {
  dominantHand: 'right' | 'left';
  handicap: number; // 0-36
  naturalShot: 'draw' | 'fade' | 'straight';
  shotHeight: 'low' | 'medium' | 'high';
  setupComplete: boolean;
}
```

### Clubs Slice
```typescript
interface ClubsState {
  clubs: Club[];
  shortGameShots: ShortGameShot[];
  customDistances: Record<string, number>;
}

interface Club {
  id: string;
  name: string;
  type: 'driver' | 'fairway' | 'hybrid' | 'iron' | 'wedge' | 'putter';
  loft: number;
  carryDistance: number;
  takebackOptions: TakebackOption[];
  faceOptions: FaceOption[];
}

interface ShortGameShot {
  distance: number; // 5-100 yards
  club: string;
  takeback: TakebackType;
  face: FaceType;
  technique: string;
}
```

### Shot Slice
```typescript
interface ShotState {
  currentConditions: Conditions;
  targetDistance: number;
  recommendation: ShotRecommendation | null;
  voiceInput: VoiceInputState;
  manualInput: ManualInputState;
}

interface Conditions {
  windSpeed: number;
  windDirection: number; // degrees
  temperature: number;
  humidity: number;
  elevation: number;
  lie: 'fairway' | 'rough' | 'sand' | 'tee';
}

interface ShotRecommendation {
  club: string;
  takeback: TakebackType;
  face: FaceType;
  adjustedDistance: number;
  confidence: number;
  alternatives: Alternative[];
}
```

### History Slice
```typescript
interface HistoryState {
  shots: ShotHistory[];
  analytics: Analytics;
  filters: HistoryFilters;
}

interface ShotHistory {
  id: string;
  timestamp: Date;
  hole: number;
  course: string;
  conditions: Conditions;
  recommendation: ShotRecommendation;
  actualResult: ShotResult;
}
```

## Redux Persist Configuration

```typescript
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['profile', 'clubs', 'history'], // Only persist these slices
  blacklist: ['shot', 'auth'], // Don't persist temporary state
};
```

## RTK Query API Slices

### Subscription API
```typescript
export const subscriptionApi = createApi({
  reducerPath: 'subscriptionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/subscription/',
  }),
  endpoints: (builder) => ({
    validateSubscription: builder.query<boolean, string>({
      query: (userId) => `validate/${userId}`,
    }),
    updateSubscription: builder.mutation<void, SubscriptionUpdate>({
      query: (data) => ({
        url: 'update',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});
```

## Offline-First Strategy

1. **Local Storage Priority**: All user data stored locally first
2. **Sync When Online**: Background sync with cloud when connected
3. **Conflict Resolution**: Last-write-wins with timestamp comparison
4. **Essential Features Offline**: Core calculations and recommendations work offline
5. **Analytics Queuing**: Store analytics events locally, batch upload when online