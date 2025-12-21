# CaddyAI Unified Data Schema

## Version: 1.0.0
## Date: December 18, 2025
## Status: APPROVED SPECIFICATION

---

## 🎯 Overview

This document defines the **single source of truth** for all data structures used across:
- Android App (React Native)
- iOS App (React Native)  
- Web App (Next.js)

All platforms read and write to the same Firebase Firestore collections using identical schemas.

---

## 📐 Core Principle: AI as Data Gatherer, Not Decision Maker

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI WORKFLOW                                  │
│                                                                  │
│  1. AI gathers missing data (distance, wind, lie, etc.)         │
│  2. AI passes data to Shot Optimizer (Excel formulas in code)   │
│  3. Shot Optimizer calculates recommendation                     │
│  4. AI reads and presents the recommendation to user            │
│                                                                  │
│  ❌ AI does NOT make its own recommendations                     │
│  ✅ Excel formulas are the "brain" of the system                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏌️ CLUBS Schema

### Definition
A **Club** represents a physical golf club in the player's bag with their standard full swing shot.

### Firestore Collection: `/clubs/{userId}`

```typescript
interface ClubDocument {
  userId: string;
  clubs: Club[];
  updatedAt: Timestamp;
  version: number;
}

interface Club {
  id: string;                    // UUID: "club_driver", "club_7i", etc.
  name: string;                  // Display name: "Driver", "7 Iron", "60°"
  
  // Standard shot configuration (Full swing, natural face)
  face: ClubFace;                // Their natural shot shape
  
  // Distances (in yards)
  carryYards: number;            // Where ball lands before rolling
  rollYards: number;             // How far ball rolls after landing
  totalYards: number;            // Carry + Roll (auto-calculated)
  
  // Metadata
  sortOrder: number;             // Display order (1 = top)
  isDefault: boolean;            // Pre-loaded vs user-added
  isActive: boolean;             // In bag or not (for club selection)
  
  // Optional
  loft?: number;                 // Degrees
  shaft?: 'Regular' | 'Stiff' | 'X-Stiff' | 'Senior' | 'Ladies';
}

type ClubFace = 'Square' | 'Draw' | 'Fade';
```

### Master Club List (22 clubs)

| Sort | ID | Name | Category |
|------|-------|------|----------|
| 1 | `club_driver` | Driver | Woods |
| 2 | `club_mini_driver` | Mini-Driver | Woods |
| 3 | `club_3w` | 3W | Woods |
| 4 | `club_5w` | 5W | Woods |
| 5 | `club_7w` | 7W | Woods |
| 6 | `club_2h` | 2H | Hybrids |
| 7 | `club_3h` | 3H | Hybrids |
| 8 | `club_4h` | 4H | Hybrids |
| 9 | `club_5h` | 5H | Hybrids |
| 10 | `club_2i` | 2i | Irons |
| 11 | `club_3i` | 3i | Irons |
| 12 | `club_4i` | 4i | Irons |
| 13 | `club_5i` | 5i | Irons |
| 14 | `club_6i` | 6i | Irons |
| 15 | `club_7i` | 7i | Irons |
| 16 | `club_8i` | 8i | Irons |
| 17 | `club_9i` | 9i | Irons |
| 18 | `club_pw` | PW | Wedges |
| 19 | `club_52` | 52° (GW) | Wedges |
| 20 | `club_56` | 56° (SW) | Wedges |
| 21 | `club_58` | 58° (LW) | Wedges |
| 22 | `club_60` | 60° | Wedges |

### Business Rules
1. **One entry per physical club** - No duplicates
2. **Always Full takeback** - Clubs represent standard full swing
3. **Face = natural shot shape** - How the player typically hits this club
4. **Driver constraint**: Only recommended when `lie === 'tee'`
5. **Mini-Driver constraint**: Only recommended when `lie === 'tee'` OR `lie === 'fairway'`

---

## ⛳ SHOTS Schema

### Definition
A **Shot** represents a specific technique/variation using a club. A single club can have unlimited shots.

### Firestore Collection: `/shots/{userId}`

```typescript
interface ShotDocument {
  userId: string;
  shots: Shot[];
  updatedAt: Timestamp;
  version: number;
}

interface Shot {
  id: string;                    // UUID: "shot_driver_fairwayfinder"
  
  // Link to club
  clubId: string;                // References Club.id
  clubName: string;              // Denormalized: "Driver", "60°"
  
  // Shot identity
  name: ShotName;                // "Fairway Finder", "Flop", etc.
  customName?: string;           // Only if name === 'Custom'
  category: 'full-swing' | 'short-game';  // Based on totalYards > 100
  
  // Shot configuration
  takeback: Takeback;
  face: ShotFace;
  
  // Distances (in yards)
  carryYards: number;            // Where ball lands
  rollYards: number;             // Can be NEGATIVE (backspin)
  totalYards: number;            // Carry + Roll
  
  // Metadata
  sortOrder: number;
  isDefault: boolean;            // Pre-loaded from Excel
  isActive: boolean;             // Available for recommendations
  
  // Optional: Ideal conditions (used by Shot Optimizer)
  idealLie?: LieType[];          // When this shot works best
  notes?: string;                // User notes
}

type Takeback = 'Full' | '3/4' | '1/2' | '1/4' | 'Chip' | 'Flop';

type ShotFace = 'Square' | 'Draw' | 'Fade' | 'Hood' | 'Open' | 'Flat';

type ShotName = 
  | 'Standard'      // Default full swing
  | 'Pitch'         // Standard pitch shot
  | 'Flop'          // High, soft landing
  | 'Chokedown'     // Choked down grip, controlled
  | 'Stinger'       // Low, penetrating flight
  | 'Fairway Finder'// Controlled tee shot
  | 'Knockdown'     // Low trajectory, wind shot
  | 'Spinner'       // High spin, stops quickly
  | 'Power'         // Maximum distance
  | 'Runner'        // Low, lots of roll
  | 'Punch'         // Under trees, low
  | 'Bump & Run'    // Chip that rolls out
  | 'Lob'           // High arc, soft landing
  | 'Chip'          // Short game basic
  | 'Custom';       // User-defined (uses customName)

type LieType = 
  | 'tee'
  | 'fairway'
  | 'rough'
  | 'deep_rough'
  | 'bunker'
  | 'fairway_bunker'
  | 'hardpan'
  | 'divot'
  | 'pine_straw'
  | 'mud';
```

### Predefined Shot Names List

For UI dropdowns and settings:

```typescript
const SHOT_NAMES: ShotName[] = [
  'Standard',
  'Pitch',
  'Flop',
  'Chokedown',
  'Stinger',
  'Fairway Finder',
  'Knockdown',
  'Spinner',
  'Power',
  'Runner',
  'Punch',
  'Bump & Run',
  'Lob',
  'Chip',
  'Custom'
];
```

### Business Rules
1. **Unlimited shots per club** - 60° might have 5+ variations
2. **Roll can be negative** - Backspin shots where ball rolls backward
3. **Category auto-set** - `totalYards > 100 ? 'full-swing' : 'short-game'`
4. **Custom names** - Only editable in Settings screen
5. **Shot Optimizer uses shots** - AI queries this for recommendations

---

## 📋 Default Shots (Excel Specification)

### Full Swing Defaults (12 shots)

These are auto-created from the Clubs when user completes onboarding:

| Club | Shot Name | Takeback | Face | Carry | Roll | Total |
|------|-----------|----------|------|-------|------|-------|
| Driver | Standard | Full | (user's face) | 280 | 20 | 300 |
| 3W | Standard | Full | (user's face) | 250 | 20 | 270 |
| 3H | Standard | Full | (user's face) | 231 | 20 | 251 |
| 5W | Standard | Full | (user's face) | 230 | 20 | 250 |
| 4H | Standard | Full | (user's face) | 210 | 20 | 230 |
| 5i | Standard | Full | (user's face) | 185 | 10 | 195 |
| 6i | Standard | Full | (user's face) | 170 | 10 | 180 |
| 7i | Standard | Full | (user's face) | 158 | 7 | 165 |
| 8i | Standard | Full | (user's face) | 145 | 5 | 150 |
| 9i | Standard | Full | (user's face) | 130 | 5 | 135 |
| PW | Standard | Full | (user's face) | 120 | 5 | 125 |
| 52° | Standard | Full | (user's face) | 102 | 3 | 105 |

### Short Game Defaults (17 shots from Excel rows 61-77)

| Club | Shot Name | Takeback | Face | Carry | Roll | Total |
|------|-----------|----------|------|-------|------|-------|
| PW | Pitch | Full | Hood | 95 | 5 | 100 |
| PW | Pitch | Full | Open | 90 | 5 | 95 |
| PW | Knockdown | 3/4 | Square | 90 | 5 | 95 |
| 56° | Pitch | Full | Draw | 80 | 5 | 85 |
| 56° | Standard | Full | Square | 78 | 4 | 82 |
| 58° | Standard | Full | Square | 72 | 3 | 75 |
| 52° | Knockdown | 3/4 | Square | 69 | 3 | 72 |
| 58° | Pitch | Full | Draw | 67 | 3 | 70 |
| 60° | Standard | Full | Square | 59 | 2 | 61 |
| 56° | Pitch | 3/4 | Square | 57 | 3 | 60 |
| PW | Chip | 1/4 | Square | 40 | 10 | 50 |
| 58° | Pitch | Full | Square | 36 | 2 | 38 |
| 58° | Chip | 1/4 | Square | 30 | 3 | 33 |
| 60° | Flop | 1/4 | Open | 22 | -2 | 20 |
| 60° | Chip | 1/4 | Flat | 15 | 3 | 18 |
| 60° | Chip | Chip | Square | 8 | 4 | 12 |
| 56° | Bump & Run | Chip | Draw | 4 | 3 | 7 |

---

## 👤 PLAYER PROFILE Schema

### Firestore Collection: `/users/{userId}`

```typescript
interface UserDocument {
  // Account
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Onboarding status
  onboardingComplete: boolean;
  profileComplete: boolean;
  clubsComplete: boolean;
  shotsComplete: boolean;
  
  // Golf Profile (5 core questions)
  profile: {
    dominantHand: 'right' | 'left';
    handicap: number;              // 0-54
    naturalShot: 'straight' | 'draw' | 'fade';
    shotHeight: 'low' | 'medium' | 'high';
    yardsOfCurve5i: number;        // Curve yards with 5 iron
  };
  
  // Experience
  experience: {
    yearsPlaying: number;          // 0-50
    playFrequency: 'rarely' | 'occasionally' | 'regularly' | 'frequently' | 'very-frequently';
  };
  
  // Skills
  skills: {
    averageDrive: number;          // 100-350 yards
    strengthArea: string;
    improvementArea: string;
  };
  
  // Personal Info (optional)
  personalInfo?: {
    name?: string;
    birthday?: string;
    phone?: string;
    address?: string;
  };
}
```

---

## ⚙️ PREFERENCES Schema

### Firestore Collection: `/preferences/{userId}`

**IMPORTANT**: Previously mobile used AsyncStorage (local only). Now ALL platforms use Firestore for sync.

```typescript
interface PreferencesDocument {
  userId: string;
  
  // Units
  units: {
    distance: 'yards' | 'meters';
    temperature: 'fahrenheit' | 'celsius';
    speed: 'mph' | 'kph';
  };
  
  // Appearance
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'es' | 'fr' | 'de' | 'ja';
    fontSize: number;              // 12-24
    highContrast: boolean;
    reduceMotion: boolean;
  };
  
  // Notifications
  notifications: {
    courseRecommendations: boolean;
    weatherAlerts: boolean;
    practiceReminders: boolean;
    achievementAlerts: boolean;
    weeklyStats: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
  };
  
  // Display Features
  display: {
    showLandingZones: boolean;
    showWindIndicator: boolean;
    showElevationChange: boolean;
    show3DFlyover: boolean;
    autoRotateMap: boolean;
  };
  
  // Privacy
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    shareStatistics: boolean;
    shareLocation: boolean;
  };
  
  // Accessibility
  accessibility: {
    voiceFeedback: boolean;
    screenReader: boolean;
  };
  
  // Custom Shot Names (user-created in Settings)
  customShotNames: string[];       // Additional names beyond predefined
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}
```

---

## 🔄 Data Sync Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FIREBASE FIRESTORE                            │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐│
│  │ /users/{uid} │  │ /clubs/{uid} │  │ /shots/{uid} │  │/prefs/{uid}││
│  │              │  │              │  │              │  │           ││
│  │ • Profile    │  │ • 22 clubs   │  │ • 29+ shots  │  │ • Units   ││
│  │ • Experience │  │ • Distances  │  │ • Variations │  │ • Theme   ││
│  │ • Skills     │  │ • Face       │  │ • Takeback   │  │ • Notifs  ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘│
│         │                 │                 │                │      │
│         └─────────────────┴─────────────────┴────────────────┘      │
│                                   │                                  │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │   Real-time Sync      │
                        │   onSnapshot()        │
                        └───────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
        ┌──────────┐          ┌──────────┐          ┌──────────┐
        │ Android  │          │   iOS    │          │   Web    │
        │   App    │          │   App    │          │   App    │
        │          │          │          │          │          │
        │ Cache:   │          │ Cache:   │          │ Cache:   │
        │ Async    │          │ Async    │          │ Local    │
        │ Storage  │          │ Storage  │          │ Storage  │
        └──────────┘          └──────────┘          └──────────┘
```

### Sync Behavior

1. **On App Launch**: 
   - Check local cache first (instant UI)
   - Fetch from Firestore
   - Update local cache if different

2. **On Data Change (any platform)**:
   - Write to Firestore
   - Other platforms receive via `onSnapshot()`
   - Local caches update automatically

3. **Offline Mode**:
   - Use local cache
   - Queue writes for when online
   - Firestore handles conflict resolution (last-write-wins)

---

## 🧮 Shot Optimizer Integration

The Shot Optimizer (Excel formulas converted to code) needs this data:

### Inputs Required
```typescript
interface ShotOptimizerInput {
  // From current shot context
  distanceToHole: number;
  lie: LieType;
  elevation: number;           // Feet above sea level
  elevationChange: number;     // Uphill (+) or downhill (-)
  
  // From weather API
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  
  // From user profile
  handicap: number;
  naturalShot: 'straight' | 'draw' | 'fade';
  shotHeight: 'low' | 'medium' | 'high';
  
  // From clubs/shots collections
  availableClubs: Club[];
  availableShots: Shot[];
  
  // Hazards (from course data)
  hazards: Hazard[];
}
```

### Output
```typescript
interface ShotOptimizerOutput {
  recommendedShot: Shot;
  alternativeShots: Shot[];
  
  adjustedDistance: number;    // After all factors
  landingZone: {
    center: { lat: number; lng: number };
    width: number;             // Dispersion width
    length: number;            // Dispersion depth
    rotation: number;          // Degrees
  };
  
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  
  explanation: string;         // For AI to read to user
}
```

---

## 📱 TypeScript Type Exports

Create these shared type files:

### `/src/types/clubs.ts`
```typescript
export interface Club { ... }
export interface ClubDocument { ... }
export type ClubFace = 'Square' | 'Draw' | 'Fade';
export const CLUB_LIST = [ ... ];
```

### `/src/types/shots.ts`
```typescript
export interface Shot { ... }
export interface ShotDocument { ... }
export type Takeback = 'Full' | '3/4' | '1/2' | '1/4' | 'Chip' | 'Flop';
export type ShotFace = 'Square' | 'Draw' | 'Fade' | 'Hood' | 'Open' | 'Flat';
export type ShotName = 'Standard' | 'Pitch' | ... | 'Custom';
export const SHOT_NAMES = [ ... ];
export const DEFAULT_SHOTS = [ ... ];
```

### `/src/types/preferences.ts`
```typescript
export interface PreferencesDocument { ... }
export const DEFAULT_PREFERENCES = { ... };
```

---

## ✅ Implementation Checklist

### Phase 1: Schema & Types
- [ ] Create shared TypeScript types
- [ ] Export from barrel files
- [ ] Update Firestore security rules

### Phase 2: Mobile App Updates
- [ ] Migrate preferences from AsyncStorage to Firestore
- [ ] Update ClubManager to use new schema
- [ ] Create ShotManager component
- [ ] Add real-time sync listeners

### Phase 3: Web App Updates
- [ ] Implement Club management page
- [ ] Implement Shot management page
- [ ] Sync with mobile schema
- [ ] Test cross-platform sync

### Phase 4: AI Integration
- [ ] Update Voice AI to query Firestore
- [ ] Connect to Shot Optimizer
- [ ] AI reads (not writes) recommendations

---

## 📚 Related Documents

- `ARCHITECTURE.md` - Overall system architecture
- `CLUB_MANAGEMENT_COMPLETE.md` - Previous club implementation
- `PREFERENCES_SYSTEM_COMPLETE.md` - Web preferences system
- `EXCEL_FORMULA_CERTIFICATION.md` - Shot Optimizer formulas

---

**Last Updated**: December 18, 2025
**Author**: Claude & Scott
**Status**: ✅ APPROVED SPECIFICATION
