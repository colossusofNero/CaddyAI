/**
 * CaddyAI - Unified Shot Types
 * 
 * These types are shared across:
 * - Android App (React Native)
 * - iOS App (React Native)
 * - Web App (Next.js)
 * 
 * DO NOT MODIFY without updating all platforms!
 */

// ============================================================================
// SHOT TYPES
// ============================================================================

export type Takeback = 'Full' | '3/4' | '1/2' | '1/4' | 'Chip' | 'Flop';

export type ShotFace = 'Square' | 'Draw' | 'Fade' | 'Hood' | 'Open' | 'Flat';

export type ShotCategory = 'full-swing' | 'short-game';

export type ShotName =
  | 'Standard'       // Default full swing
  | 'Pitch'          // Standard pitch shot
  | 'Flop'           // High, soft landing
  | 'Chokedown'      // Choked down grip, controlled
  | 'Stinger'        // Low, penetrating flight
  | 'Fairway Finder' // Controlled tee shot
  | 'Knockdown'      // Low trajectory, wind shot
  | 'Spinner'        // High spin, stops quickly
  | 'Power'          // Maximum distance
  | 'Runner'         // Low, lots of roll
  | 'Punch'          // Under trees, low
  | 'Bump & Run'     // Chip that rolls out
  | 'Lob'            // High arc, soft landing
  | 'Chip'           // Short game basic
  | 'Custom';        // User-defined (uses customName)

export type LieType =
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

export interface Shot {
  id: string;                    // UUID: "shot_driver_fairwayfinder"
  
  // Link to club
  clubId: string;                // References Club.id
  clubName: string;              // Denormalized: "Driver", "60°"
  
  // Shot identity
  name: ShotName;                // "Fairway Finder", "Flop", etc.
  customName?: string;           // Only if name === 'Custom'
  category: ShotCategory;        // Based on totalYards > 100
  
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

export interface ShotDocument {
  userId: string;
  shots: Shot[];
  updatedAt: any;                // Firestore Timestamp
  version: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All predefined shot names for dropdown menus
 */
export const SHOT_NAMES: ShotName[] = [
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
  'Custom',
];

/**
 * Takeback options for dropdown menus
 */
export const TAKEBACK_OPTIONS: Takeback[] = [
  'Full',
  '3/4',
  '1/2',
  '1/4',
  'Chip',
  'Flop',
];

/**
 * Face options for dropdown menus
 */
export const FACE_OPTIONS: ShotFace[] = [
  'Square',
  'Draw',
  'Fade',
  'Hood',
  'Open',
  'Flat',
];

/**
 * Lie types for dropdown menus
 */
export const LIE_TYPES: LieType[] = [
  'tee',
  'fairway',
  'rough',
  'deep_rough',
  'bunker',
  'fairway_bunker',
  'hardpan',
  'divot',
  'pine_straw',
  'mud',
];

/**
 * Human-readable lie type labels
 */
export const LIE_TYPE_LABELS: Record<LieType, string> = {
  tee: 'Tee',
  fairway: 'Fairway',
  rough: 'Rough',
  deep_rough: 'Deep Rough',
  bunker: 'Bunker',
  fairway_bunker: 'Fairway Bunker',
  hardpan: 'Hardpan',
  divot: 'Divot',
  pine_straw: 'Pine Straw',
  mud: 'Mud',
};

// ============================================================================
// DEFAULT SHOTS (Excel Rows 61-77 + Standard Full Swings)
// ============================================================================

export interface DefaultShot {
  clubId: string;
  clubName: string;
  name: ShotName;
  takeback: Takeback;
  face: ShotFace;
  carryYards: number;
  rollYards: number;
  category: ShotCategory;
  idealLie?: LieType[];
}

/**
 * Default short game shots (Excel rows 61-77)
 * These are pre-loaded for all users
 */
export const DEFAULT_SHORT_GAME_SHOTS: DefaultShot[] = [
  // PW shots
  {
    clubId: 'club_pw',
    clubName: 'PW',
    name: 'Pitch',
    takeback: 'Full',
    face: 'Hood',
    carryYards: 95,
    rollYards: 5,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  {
    clubId: 'club_pw',
    clubName: 'PW',
    name: 'Pitch',
    takeback: 'Full',
    face: 'Open',
    carryYards: 90,
    rollYards: 5,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  {
    clubId: 'club_pw',
    clubName: 'PW',
    name: 'Knockdown',
    takeback: '3/4',
    face: 'Square',
    carryYards: 90,
    rollYards: 5,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  {
    clubId: 'club_pw',
    clubName: 'PW',
    name: 'Chip',
    takeback: '1/4',
    face: 'Square',
    carryYards: 40,
    rollYards: 10,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  
  // 52° shots
  {
    clubId: 'club_52',
    clubName: '52°',
    name: 'Knockdown',
    takeback: '3/4',
    face: 'Square',
    carryYards: 69,
    rollYards: 3,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  
  // 56° shots
  {
    clubId: 'club_56',
    clubName: '56°',
    name: 'Pitch',
    takeback: 'Full',
    face: 'Draw',
    carryYards: 80,
    rollYards: 5,
    category: 'short-game',
    idealLie: ['fairway', 'rough', 'bunker'],
  },
  {
    clubId: 'club_56',
    clubName: '56°',
    name: 'Standard',
    takeback: 'Full',
    face: 'Square',
    carryYards: 78,
    rollYards: 4,
    category: 'short-game',
    idealLie: ['fairway', 'rough', 'bunker'],
  },
  {
    clubId: 'club_56',
    clubName: '56°',
    name: 'Pitch',
    takeback: '3/4',
    face: 'Square',
    carryYards: 57,
    rollYards: 3,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  {
    clubId: 'club_56',
    clubName: '56°',
    name: 'Bump & Run',
    takeback: 'Chip',
    face: 'Draw',
    carryYards: 4,
    rollYards: 3,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  
  // 58° shots
  {
    clubId: 'club_58',
    clubName: '58°',
    name: 'Standard',
    takeback: 'Full',
    face: 'Square',
    carryYards: 72,
    rollYards: 3,
    category: 'short-game',
    idealLie: ['fairway', 'rough', 'bunker'],
  },
  {
    clubId: 'club_58',
    clubName: '58°',
    name: 'Pitch',
    takeback: 'Full',
    face: 'Draw',
    carryYards: 67,
    rollYards: 3,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  {
    clubId: 'club_58',
    clubName: '58°',
    name: 'Pitch',
    takeback: 'Full',
    face: 'Square',
    carryYards: 36,
    rollYards: 2,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  {
    clubId: 'club_58',
    clubName: '58°',
    name: 'Chip',
    takeback: '1/4',
    face: 'Square',
    carryYards: 30,
    rollYards: 3,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  
  // 60° shots
  {
    clubId: 'club_60',
    clubName: '60°',
    name: 'Standard',
    takeback: 'Full',
    face: 'Square',
    carryYards: 59,
    rollYards: 2,
    category: 'short-game',
    idealLie: ['fairway', 'rough', 'bunker'],
  },
  {
    clubId: 'club_60',
    clubName: '60°',
    name: 'Flop',
    takeback: '1/4',
    face: 'Open',
    carryYards: 22,
    rollYards: -2,  // NEGATIVE - backspin!
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  {
    clubId: 'club_60',
    clubName: '60°',
    name: 'Chip',
    takeback: '1/4',
    face: 'Flat',
    carryYards: 15,
    rollYards: 3,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
  {
    clubId: 'club_60',
    clubName: '60°',
    name: 'Chip',
    takeback: 'Chip',
    face: 'Square',
    carryYards: 8,
    rollYards: 4,
    category: 'short-game',
    idealLie: ['fairway', 'rough'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique shot ID
 */
export function generateShotId(clubId: string, shotName: string): string {
  const safeName = shotName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36);
  return `shot_${clubId.replace('club_', '')}_${safeName}_${timestamp}`;
}

/**
 * Calculate total distance (handles negative roll for backspin)
 */
export function calculateShotTotal(carry: number, roll: number): number {
  return carry + roll;  // Roll can be negative
}

/**
 * Determine category based on total distance
 */
export function getShotCategory(totalYards: number): ShotCategory {
  return totalYards > 100 ? 'full-swing' : 'short-game';
}

/**
 * Generate default shots for a new user
 * Creates Standard shot for each club + all short game shots
 */
export function generateDefaultShots(
  clubs: Array<{ id: string; name: string; face: string; carryYards: number; rollYards: number }>
): Shot[] {
  const shots: Shot[] = [];
  let sortOrder = 1;
  
  // Create Standard shot for each full-swing club
  clubs.forEach(club => {
    const total = club.carryYards + club.rollYards;
    
    if (total > 100) {
      shots.push({
        id: generateShotId(club.id, 'standard'),
        clubId: club.id,
        clubName: club.name,
        name: 'Standard',
        category: 'full-swing',
        takeback: 'Full',
        face: club.face as ShotFace,
        carryYards: club.carryYards,
        rollYards: club.rollYards,
        totalYards: total,
        sortOrder: sortOrder++,
        isDefault: true,
        isActive: true,
      });
    }
  });
  
  // Add all default short game shots
  DEFAULT_SHORT_GAME_SHOTS.forEach(defaultShot => {
    const total = defaultShot.carryYards + defaultShot.rollYards;
    
    shots.push({
      id: generateShotId(defaultShot.clubId, defaultShot.name),
      clubId: defaultShot.clubId,
      clubName: defaultShot.clubName,
      name: defaultShot.name,
      category: defaultShot.category,
      takeback: defaultShot.takeback,
      face: defaultShot.face,
      carryYards: defaultShot.carryYards,
      rollYards: defaultShot.rollYards,
      totalYards: total,
      sortOrder: sortOrder++,
      isDefault: true,
      isActive: true,
      idealLie: defaultShot.idealLie,
    });
  });
  
  return shots;
}

/**
 * Get shots grouped by club for UI display
 */
export function getShotsByClub(shots: Shot[]): Record<string, Shot[]> {
  const grouped: Record<string, Shot[]> = {};
  
  shots.forEach(shot => {
    if (!grouped[shot.clubName]) {
      grouped[shot.clubName] = [];
    }
    grouped[shot.clubName].push(shot);
  });
  
  // Sort shots within each club by sortOrder
  Object.keys(grouped).forEach(clubName => {
    grouped[clubName].sort((a, b) => a.sortOrder - b.sortOrder);
  });
  
  return grouped;
}

/**
 * Get shots by category for UI display
 */
export function getShotsByCategory(shots: Shot[]): Record<ShotCategory, Shot[]> {
  return {
    'full-swing': shots.filter(s => s.category === 'full-swing').sort((a, b) => a.sortOrder - b.sortOrder),
    'short-game': shots.filter(s => s.category === 'short-game').sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

/**
 * Find shots that match a target distance (within tolerance)
 */
export function findShotsForDistance(
  shots: Shot[],
  targetDistance: number,
  toleranceYards: number = 5
): Shot[] {
  return shots
    .filter(shot => 
      shot.isActive && 
      Math.abs(shot.totalYards - targetDistance) <= toleranceYards
    )
    .sort((a, b) => 
      Math.abs(a.totalYards - targetDistance) - Math.abs(b.totalYards - targetDistance)
    );
}

/**
 * Find shots appropriate for a given lie
 */
export function findShotsForLie(shots: Shot[], lie: LieType): Shot[] {
  return shots.filter(shot => {
    // If no idealLie specified, shot works from any lie
    if (!shot.idealLie || shot.idealLie.length === 0) return true;
    return shot.idealLie.includes(lie);
  });
}

/**
 * Validate shot data
 */
export function validateShot(shot: Partial<Shot>): string[] {
  const errors: string[] = [];
  
  if (!shot.clubId) errors.push('Club is required');
  if (!shot.name) errors.push('Shot name is required');
  if (shot.name === 'Custom' && !shot.customName) errors.push('Custom name is required');
  if (!shot.takeback) errors.push('Takeback is required');
  if (!shot.face) errors.push('Face is required');
  if (shot.carryYards === undefined || shot.carryYards < 0) errors.push('Carry distance must be positive');
  if (shot.rollYards === undefined) errors.push('Roll distance is required');
  
  return errors;
}

/**
 * Create a new shot with defaults
 */
export function createShot(
  clubId: string,
  clubName: string,
  overrides: Partial<Shot> = {}
): Shot {
  const name = overrides.name || 'Standard';
  const carryYards = overrides.carryYards || 100;
  const rollYards = overrides.rollYards || 5;
  const totalYards = carryYards + rollYards;
  
  return {
    id: generateShotId(clubId, name),
    clubId,
    clubName,
    name,
    category: getShotCategory(totalYards),
    takeback: 'Full',
    face: 'Square',
    carryYards,
    rollYards,
    totalYards,
    sortOrder: 999,  // Will be updated when saved
    isDefault: false,
    isActive: true,
    ...overrides,
  };
}
