# UI Design System & Mockups

## Design Tokens

### Color Palette
```typescript
export const colors = {
  // Primary Golf Green
  primary: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    900: '#1B5E20',
  },

  // Secondary Earth Tones
  secondary: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    500: '#FF9800',
    700: '#F57C00',
    900: '#E65100',
  },

  // Neutral Grays
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    500: '#9E9E9E',
    700: '#616161',
    900: '#212121',
  },

  // Semantic Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Background
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
};
```

### Typography Scale
```typescript
export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Spacing System
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};
```

## Screen Mockups

### 1. Login/Registration Screen
```
┌─────────────────────────────────┐
│          CADDY AI               │
│                                 │
│    🏌️‍♂️ Your Smart Golf Caddy     │
│                                 │
│  ┌─────────────────────────────┐ │
│  │         Email               │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │        Password             │ │
│  └─────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐ │
│  │         Sign In             │ │
│  └─────────────────────────────┘ │
│                                 │
│         Create Account          │
│                                 │
│    ┌─────┐ ┌─────┐ ┌─────┐      │
│    │ Pro │ │Plus │ │Basic│      │
│    │$9.99│ │$4.99│ │Free │      │
│    └─────┘ └─────┘ └─────┘      │
└─────────────────────────────────┘
```

### 2. Profile Setup Screen
```
┌─────────────────────────────────┐
│        Profile Setup            │
│                                 │
│  Dominant Hand                  │
│  ┌─────────┐ ┌─────────┐        │
│  │ ✓ Right │ │  Left   │        │
│  └─────────┘ └─────────┘        │
│                                 │
│  Handicap: [15    ] (0-36)      │
│                                 │
│  Natural Shot Shape             │
│  ┌──────┐┌──────┐┌──────────┐   │
│  │ Draw ││ Fade ││ Straight │   │
│  └──────┘└──────┘└──────────┘   │
│                                 │
│  Ball Flight                    │
│  ┌─────┐ ┌────────┐ ┌──────┐    │
│  │ Low │ │ Medium │ │ High │    │
│  └─────┘ └────────┘ └──────┘    │
│                                 │
│  ┌─────────────────────────────┐ │
│  │           Continue          │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 3. Club Configuration Screen
```
┌─────────────────────────────────┐
│     Club Configuration          │
│ ┌─────┬────────────┬──────────┐ │
│ │Club │   Carry    │  Edit    │ │
│ ├─────┼────────────┼──────────┤ │
│ │  D  │   275 yds  │    ⚙️     │ │
│ │ 3W  │   250 yds  │    ⚙️     │ │
│ │ 5W  │   225 yds  │    ⚙️     │ │
│ │ 4H  │   200 yds  │    ⚙️     │ │
│ │ 5I  │   180 yds  │    ⚙️     │ │
│ │ 6I  │   170 yds  │    ⚙️     │ │
│ │ 7I  │   160 yds  │    ⚙️     │ │
│ │ 8I  │   150 yds  │    ⚙️     │ │
│ │ 9I  │   140 yds  │    ⚙️     │ │
│ │ PW  │   130 yds  │    ⚙️     │ │
│ │ SW  │   110 yds  │    ⚙️     │ │
│ │ LW  │    90 yds  │    ⚙️     │ │
│ │ PT  │     -      │    ⚙️     │ │
│ └─────┴────────────┴──────────┘ │
│                                 │
│  📊 Short Game Shots (5-100y)   │
└─────────────────────────────────┘
```

### 4. Main Shot Screen
```
┌─────────────────────────────────┐
│ 🌤️ Partly Cloudy  🌡️ 72°F       │
│ 💨 5mph NW       ⬆️ 150ft        │
│                                 │
│        Target Distance          │
│      ┌───────────────┐          │
│      │     165       │          │
│      │     YARDS     │          │
│      └───────────────┘          │
│                                 │
│ ┌─────────────────────────────┐ │
│ │        🎤 VOICE            │ │
│ │      TAP TO SPEAK          │ │
│ └─────────────────────────────┘ │
│                                 │
│     ┌──────────────────────┐     │
│     │    Manual Input      │     │
│     └──────────────────────┘     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │     RECOMMENDATION         │ │
│ │                            │ │
│ │    🏌️ 7 Iron - Full Swing   │ │
│ │    📐 Square Face          │ │
│ │    📏 165 yards            │ │
│ │    💪 95% confidence       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 5. History/Analytics Screen
```
┌─────────────────────────────────┐
│        Shot History             │
│                                 │
│ 📊 This Round: 14 of 14 shots   │
│ 🎯 Accuracy: 78%                │
│ ⭐ Best Club: 7 Iron             │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Hole 1 - Par 4 - Driver    │ │
│ │ Rec: 275y → Actual: 280y   │ │
│ │ ✅ Within 5 yards           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Hole 1 - Approach - 7I     │ │
│ │ Rec: 165y → Actual: 160y   │ │
│ │ ✅ Within 10 yards          │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Hole 2 - Par 3 - 6I        │ │
│ │ Rec: 170y → Actual: 175y   │ │
│ │ ⚠️  Off by 5 yards          │ │
│ └─────────────────────────────┘ │
│                                 │
│    📈 View Analytics            │
└─────────────────────────────────┘
```

## Responsive Design

### Portrait Mode (Primary)
- Single column layout
- Large touch targets (min 44px)
- Voice button prominently placed
- Thumb-friendly navigation

### Landscape Mode
- Two column layout for tablets
- Horizontal club selection
- Side-by-side recommendation and conditions
- Optimized for one-handed use

## Accessibility Features

### Visual
- High contrast mode support
- Large text scaling (up to 200%)
- Color-blind friendly palette
- Focus indicators

### Motor
- Large touch targets
- Voice-first interactions
- Gesture shortcuts
- One-handed operation

### Cognitive
- Simple, consistent layouts
- Clear visual hierarchy
- Minimal cognitive load
- Progressive disclosure