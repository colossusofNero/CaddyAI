# Navigation Structure

## Navigation Hierarchy

```
App
├── AuthNavigator (Stack)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── SubscriptionScreen
├── OnboardingNavigator (Stack)
│   ├── WelcomeScreen
│   ├── ProfileSetupScreen
│   └── ClubConfigScreen
└── MainNavigator (Tab)
    ├── ShotTab (Stack)
    │   ├── MainShotScreen
    │   ├── VoiceInputScreen
    │   ├── ManualInputScreen
    │   └── ShotResultScreen
    ├── ClubsTab (Stack)
    │   ├── ClubListScreen
    │   ├── ClubEditScreen
    │   └── ShortGameScreen
    ├── ProfileTab (Stack)
    │   ├── ProfileScreen
    │   ├── EditProfileScreen
    │   └── SettingsScreen
    └── HistoryTab (Stack)
        ├── HistoryScreen
        ├── AnalyticsScreen
        └── ShotDetailScreen
```

## Navigation Configuration

### Root Navigation Types
```typescript
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Subscription: { userId: string };
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileSetup: undefined;
  ClubConfig: undefined;
};

export type MainTabParamList = {
  Shot: NavigatorScreenParams<ShotStackParamList>;
  Clubs: NavigatorScreenParams<ClubsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  History: NavigatorScreenParams<HistoryStackParamList>;
};
```

### Tab Bar Configuration
```typescript
const tabBarOptions = {
  activeTintColor: '#2E7D32',
  inactiveTintColor: '#757575',
  style: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E0E0E0',
    height: 60,
  },
  labelStyle: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabStyle: {
    paddingVertical: 5,
  },
};

const tabBarIcons = {
  Shot: ({ color, size }) => <ShotIcon color={color} size={size} />,
  Clubs: ({ color, size }) => <ClubIcon color={color} size={size} />,
  Profile: ({ color, size }) => <ProfileIcon color={color} size={size} />,
  History: ({ color, size }) => <HistoryIcon color={color} size={size} />,
};
```

## Deep Linking Configuration

### URL Schemes
```
caddyai://shot/new
caddyai://shot/voice
caddyai://clubs/config
caddyai://history/analytics
caddyai://profile/setup
```

### Link Configuration
```typescript
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['caddyai://'],
  config: {
    screens: {
      Main: {
        screens: {
          Shot: {
            screens: {
              MainShotScreen: 'shot/new',
              VoiceInputScreen: 'shot/voice',
            },
          },
          Clubs: {
            screens: {
              ClubListScreen: 'clubs',
              ClubEditScreen: 'clubs/edit/:clubId',
            },
          },
          History: {
            screens: {
              HistoryScreen: 'history',
              AnalyticsScreen: 'history/analytics',
            },
          },
        },
      },
    },
  },
};
```

## Navigation Guards

### Authentication Guard
```typescript
function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const subscription = useSelector(selectSubscription);

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (!subscription.active) {
    return <SubscriptionScreen />;
  }

  return <>{children}</>;
}
```

### Onboarding Guard
```typescript
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const profileSetup = useSelector(selectProfileSetupComplete);
  const clubsConfigured = useSelector(selectClubsConfigured);

  if (!profileSetup || !clubsConfigured) {
    return <OnboardingNavigator />;
  }

  return <>{children}</>;
}
```

## Screen Transitions

### iOS-style transitions for stack navigators
```typescript
const screenOptions = {
  headerShown: true,
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
};
```

### Custom transitions for voice input
```typescript
const voiceScreenOptions = {
  presentation: 'modal',
  animationTypeForReplace: 'push',
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
};
```