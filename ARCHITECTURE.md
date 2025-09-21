# CaddyAI - React Native Golf App Architecture

## Component Hierarchy

```
App/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── VoiceButton.tsx
│   │   │   └── AccessibilityWrapper.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── SubscriptionTier.tsx
│   │   ├── profile/
│   │   │   ├── ProfileSetup.tsx
│   │   │   ├── HandSelector.tsx
│   │   │   ├── HandicapInput.tsx
│   │   │   ├── ShotStyleSelector.tsx
│   │   │   └── ShotHeightSelector.tsx
│   │   ├── clubs/
│   │   │   ├── ClubConfiguration.tsx
│   │   │   ├── ClubCard.tsx
│   │   │   ├── DistanceInput.tsx
│   │   │   ├── TakebackSelector.tsx
│   │   │   ├── FaceSelector.tsx
│   │   │   └── ShortGameEditor.tsx
│   │   ├── shot/
│   │   │   ├── ShotScreen.tsx
│   │   │   ├── VoiceInput.tsx
│   │   │   ├── ManualInput.tsx
│   │   │   ├── ConditionsDisplay.tsx
│   │   │   ├── RecommendationCard.tsx
│   │   │   └── ShotVisualization.tsx
│   │   └── history/
│   │       ├── HistoryScreen.tsx
│   │       ├── ShotHistoryCard.tsx
│   │       ├── Analytics.tsx
│   │       └── StatsChart.tsx
│   ├── screens/
│   │   ├── AuthScreen.tsx
│   │   ├── ProfileSetupScreen.tsx
│   │   ├── ClubConfigScreen.tsx
│   │   ├── MainShotScreen.tsx
│   │   └── HistoryAnalyticsScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainTabNavigator.tsx
│   ├── store/
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── profileSlice.ts
│   │   │   ├── clubsSlice.ts
│   │   │   ├── shotSlice.ts
│   │   │   └── historySlice.ts
│   │   └── persist.ts
│   ├── services/
│   │   ├── storage.ts
│   │   ├── voice.ts
│   │   ├── subscription.ts
│   │   ├── calculations.ts
│   │   └── analytics.ts
│   ├── hooks/
│   │   ├── useVoice.ts
│   │   ├── useStorage.ts
│   │   ├── useOrientation.ts
│   │   └── useAccessibility.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── calculations.ts
│   │   ├── validation.ts
│   │   └── formatters.ts
│   └── types/
│       ├── auth.ts
│       ├── profile.ts
│       ├── clubs.ts
│       ├── shot.ts
│       └── navigation.ts
├── assets/
│   ├── images/
│   ├── icons/
│   └── sounds/
└── __tests__/
    ├── components/
    ├── screens/
    ├── utils/
    └── services/
```

## Architecture Principles

### 1. Component-Based Architecture
- Atomic design principles (atoms, molecules, organisms)
- Reusable components with clear prop interfaces
- Separation of concerns between UI and business logic

### 2. State Management Strategy
- Redux Toolkit for global state management
- RTK Query for API calls and caching
- Redux Persist for offline storage
- Local component state for UI-only concerns

### 3. Navigation Structure
- React Navigation v6 with TypeScript
- Tab-based navigation for main features
- Stack navigation for detailed flows
- Deep linking support for specific screens

### 4. Performance Optimization
- React.memo for component memoization
- useMemo and useCallback for expensive calculations
- Lazy loading for non-critical screens
- Image optimization and caching
- Voice processing optimization

### 5. Accessibility Features
- Screen reader support
- High contrast mode
- Large text support
- Voice-first interactions
- Keyboard navigation