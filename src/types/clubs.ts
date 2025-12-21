/**
 * CaddyAI - Unified Club Types
 * 
 * These types are shared across:
 * - Android App (React Native)
 * - iOS App (React Native)
 * - Web App (Next.js)
 * 
 * DO NOT MODIFY without updating all platforms!
 */

// ============================================================================
// CLUB TYPES
// ============================================================================

export type ClubFace = 'Square' | 'Draw' | 'Fade';

export type ClubShaft = 'Regular' | 'Stiff' | 'X-Stiff' | 'Senior' | 'Ladies';

export type ClubCategory = 'Woods' | 'Hybrids' | 'Irons' | 'Wedges';

export interface Club {
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
  shaft?: ClubShaft;
  category?: ClubCategory;       // For grouping in UI
}

export interface ClubDocument {
  userId: string;
  clubs: Club[];
  updatedAt: any;                // Firestore Timestamp
  version: number;
}

// ============================================================================
// MASTER CLUB LIST
// ============================================================================

export interface ClubDefinition {
  id: string;
  name: string;
  sortOrder: number;
  category: ClubCategory;
  defaultLoft?: number;
  teeOnly?: boolean;             // Only recommend off the tee
  teeOrFairway?: boolean;        // Tee or fairway only
}

export const CLUB_LIST: ClubDefinition[] = [
  // Woods
  { id: 'club_driver', name: 'Driver', sortOrder: 1, category: 'Woods', defaultLoft: 10.5, teeOnly: true },
  { id: 'club_mini_driver', name: 'Mini-Driver', sortOrder: 2, category: 'Woods', defaultLoft: 14, teeOrFairway: true },
  { id: 'club_3w', name: '3W', sortOrder: 3, category: 'Woods', defaultLoft: 15 },
  { id: 'club_5w', name: '5W', sortOrder: 4, category: 'Woods', defaultLoft: 18 },
  { id: 'club_7w', name: '7W', sortOrder: 5, category: 'Woods', defaultLoft: 21 },
  
  // Hybrids
  { id: 'club_2h', name: '2H', sortOrder: 6, category: 'Hybrids', defaultLoft: 17 },
  { id: 'club_3h', name: '3H', sortOrder: 7, category: 'Hybrids', defaultLoft: 19 },
  { id: 'club_4h', name: '4H', sortOrder: 8, category: 'Hybrids', defaultLoft: 22 },
  { id: 'club_5h', name: '5H', sortOrder: 9, category: 'Hybrids', defaultLoft: 25 },
  
  // Irons
  { id: 'club_2i', name: '2i', sortOrder: 10, category: 'Irons', defaultLoft: 18 },
  { id: 'club_3i', name: '3i', sortOrder: 11, category: 'Irons', defaultLoft: 21 },
  { id: 'club_4i', name: '4i', sortOrder: 12, category: 'Irons', defaultLoft: 24 },
  { id: 'club_5i', name: '5i', sortOrder: 13, category: 'Irons', defaultLoft: 27 },
  { id: 'club_6i', name: '6i', sortOrder: 14, category: 'Irons', defaultLoft: 30 },
  { id: 'club_7i', name: '7i', sortOrder: 15, category: 'Irons', defaultLoft: 33 },
  { id: 'club_8i', name: '8i', sortOrder: 16, category: 'Irons', defaultLoft: 36 },
  { id: 'club_9i', name: '9i', sortOrder: 17, category: 'Irons', defaultLoft: 40 },
  
  // Wedges
  { id: 'club_pw', name: 'PW', sortOrder: 18, category: 'Wedges', defaultLoft: 44 },
  { id: 'club_52', name: '52° (GW)', sortOrder: 19, category: 'Wedges', defaultLoft: 52 },
  { id: 'club_56', name: '56° (SW)', sortOrder: 20, category: 'Wedges', defaultLoft: 56 },
  { id: 'club_58', name: '58° (LW)', sortOrder: 21, category: 'Wedges', defaultLoft: 58 },
  { id: 'club_60', name: '60°', sortOrder: 22, category: 'Wedges', defaultLoft: 60 },
];

// ============================================================================
// DEFAULT CLUB DISTANCES
// ============================================================================

export interface DefaultClubDistances {
  clubId: string;
  handicapRanges: {
    scratch: { carry: number; roll: number };     // 0-5
    low: { carry: number; roll: number };         // 6-10
    mid: { carry: number; roll: number };         // 11-18
    high: { carry: number; roll: number };        // 19-36
    beginner: { carry: number; roll: number };    // 37+
  };
}

export const DEFAULT_CLUB_DISTANCES: DefaultClubDistances[] = [
  {
    clubId: 'club_driver',
    handicapRanges: {
      scratch: { carry: 280, roll: 20 },
      low: { carry: 260, roll: 20 },
      mid: { carry: 240, roll: 20 },
      high: { carry: 210, roll: 15 },
      beginner: { carry: 180, roll: 15 },
    }
  },
  {
    clubId: 'club_mini_driver',
    handicapRanges: {
      scratch: { carry: 260, roll: 20 },
      low: { carry: 245, roll: 20 },
      mid: { carry: 225, roll: 18 },
      high: { carry: 200, roll: 15 },
      beginner: { carry: 170, roll: 12 },
    }
  },
  {
    clubId: 'club_3w',
    handicapRanges: {
      scratch: { carry: 250, roll: 20 },
      low: { carry: 235, roll: 18 },
      mid: { carry: 215, roll: 15 },
      high: { carry: 190, roll: 12 },
      beginner: { carry: 160, roll: 10 },
    }
  },
  {
    clubId: 'club_5w',
    handicapRanges: {
      scratch: { carry: 235, roll: 18 },
      low: { carry: 220, roll: 15 },
      mid: { carry: 200, roll: 12 },
      high: { carry: 175, roll: 10 },
      beginner: { carry: 150, roll: 8 },
    }
  },
  {
    clubId: 'club_7w',
    handicapRanges: {
      scratch: { carry: 220, roll: 15 },
      low: { carry: 205, roll: 12 },
      mid: { carry: 185, roll: 10 },
      high: { carry: 160, roll: 8 },
      beginner: { carry: 140, roll: 6 },
    }
  },
  {
    clubId: 'club_3h',
    handicapRanges: {
      scratch: { carry: 225, roll: 15 },
      low: { carry: 210, roll: 12 },
      mid: { carry: 190, roll: 10 },
      high: { carry: 165, roll: 8 },
      beginner: { carry: 145, roll: 6 },
    }
  },
  {
    clubId: 'club_4h',
    handicapRanges: {
      scratch: { carry: 215, roll: 12 },
      low: { carry: 200, roll: 10 },
      mid: { carry: 180, roll: 8 },
      high: { carry: 155, roll: 6 },
      beginner: { carry: 135, roll: 5 },
    }
  },
  {
    clubId: 'club_5h',
    handicapRanges: {
      scratch: { carry: 200, roll: 10 },
      low: { carry: 185, roll: 8 },
      mid: { carry: 168, roll: 7 },
      high: { carry: 145, roll: 5 },
      beginner: { carry: 125, roll: 4 },
    }
  },
  {
    clubId: 'club_5i',
    handicapRanges: {
      scratch: { carry: 195, roll: 10 },
      low: { carry: 180, roll: 8 },
      mid: { carry: 165, roll: 7 },
      high: { carry: 145, roll: 5 },
      beginner: { carry: 125, roll: 4 },
    }
  },
  {
    clubId: 'club_6i',
    handicapRanges: {
      scratch: { carry: 185, roll: 8 },
      low: { carry: 170, roll: 7 },
      mid: { carry: 155, roll: 6 },
      high: { carry: 135, roll: 5 },
      beginner: { carry: 115, roll: 4 },
    }
  },
  {
    clubId: 'club_7i',
    handicapRanges: {
      scratch: { carry: 175, roll: 7 },
      low: { carry: 160, roll: 6 },
      mid: { carry: 145, roll: 5 },
      high: { carry: 125, roll: 4 },
      beginner: { carry: 105, roll: 3 },
    }
  },
  {
    clubId: 'club_8i',
    handicapRanges: {
      scratch: { carry: 165, roll: 5 },
      low: { carry: 150, roll: 5 },
      mid: { carry: 135, roll: 4 },
      high: { carry: 115, roll: 3 },
      beginner: { carry: 95, roll: 3 },
    }
  },
  {
    clubId: 'club_9i',
    handicapRanges: {
      scratch: { carry: 155, roll: 4 },
      low: { carry: 140, roll: 4 },
      mid: { carry: 125, roll: 3 },
      high: { carry: 105, roll: 3 },
      beginner: { carry: 85, roll: 2 },
    }
  },
  {
    clubId: 'club_pw',
    handicapRanges: {
      scratch: { carry: 145, roll: 3 },
      low: { carry: 130, roll: 3 },
      mid: { carry: 115, roll: 3 },
      high: { carry: 95, roll: 2 },
      beginner: { carry: 75, roll: 2 },
    }
  },
  {
    clubId: 'club_52',
    handicapRanges: {
      scratch: { carry: 125, roll: 2 },
      low: { carry: 115, roll: 2 },
      mid: { carry: 100, roll: 2 },
      high: { carry: 85, roll: 2 },
      beginner: { carry: 65, roll: 2 },
    }
  },
  {
    clubId: 'club_56',
    handicapRanges: {
      scratch: { carry: 105, roll: 2 },
      low: { carry: 95, roll: 2 },
      mid: { carry: 85, roll: 2 },
      high: { carry: 70, roll: 2 },
      beginner: { carry: 55, roll: 2 },
    }
  },
  {
    clubId: 'club_58',
    handicapRanges: {
      scratch: { carry: 90, roll: 2 },
      low: { carry: 82, roll: 2 },
      mid: { carry: 72, roll: 2 },
      high: { carry: 60, roll: 2 },
      beginner: { carry: 48, roll: 2 },
    }
  },
  {
    clubId: 'club_60',
    handicapRanges: {
      scratch: { carry: 75, roll: 2 },
      low: { carry: 68, roll: 2 },
      mid: { carry: 60, roll: 2 },
      high: { carry: 50, roll: 2 },
      beginner: { carry: 40, roll: 2 },
    }
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get handicap range key from numeric handicap
 */
export function getHandicapRange(handicap: number): keyof DefaultClubDistances['handicapRanges'] {
  if (handicap <= 5) return 'scratch';
  if (handicap <= 10) return 'low';
  if (handicap <= 18) return 'mid';
  if (handicap <= 36) return 'high';
  return 'beginner';
}

/**
 * Generate default clubs for a new user based on handicap
 */
export function generateDefaultClubs(handicap: number, naturalFace: ClubFace): Club[] {
  const range = getHandicapRange(handicap);
  
  return CLUB_LIST.map(clubDef => {
    const distances = DEFAULT_CLUB_DISTANCES.find(d => d.clubId === clubDef.id);
    const dist = distances?.handicapRanges[range] || { carry: 100, roll: 5 };
    
    return {
      id: clubDef.id,
      name: clubDef.name,
      face: naturalFace,
      carryYards: dist.carry,
      rollYards: dist.roll,
      totalYards: dist.carry + dist.roll,
      sortOrder: clubDef.sortOrder,
      isDefault: true,
      isActive: true,
      loft: clubDef.defaultLoft,
      category: clubDef.category,
    };
  });
}

/**
 * Calculate total distance from carry and roll
 */
export function calculateTotalDistance(carry: number, roll: number): number {
  return carry + roll;
}

/**
 * Check if a club can be used from a given lie
 */
export function canUseClubFromLie(clubId: string, lie: string): boolean {
  const clubDef = CLUB_LIST.find(c => c.id === clubId);
  
  if (!clubDef) return false;
  
  // Driver only off the tee
  if (clubDef.teeOnly) {
    return lie === 'tee';
  }
  
  // Mini-driver only from tee or fairway
  if (clubDef.teeOrFairway) {
    return lie === 'tee' || lie === 'fairway';
  }
  
  // All other clubs can be used from any lie
  return true;
}

/**
 * Get clubs grouped by category for UI display
 */
export function getClubsByCategory(clubs: Club[]): Record<ClubCategory, Club[]> {
  const grouped: Record<ClubCategory, Club[]> = {
    Woods: [],
    Hybrids: [],
    Irons: [],
    Wedges: [],
  };
  
  clubs.forEach(club => {
    const category = club.category || getCategoryFromId(club.id);
    grouped[category].push(club);
  });
  
  // Sort each category by sortOrder
  Object.keys(grouped).forEach(cat => {
    grouped[cat as ClubCategory].sort((a, b) => a.sortOrder - b.sortOrder);
  });
  
  return grouped;
}

function getCategoryFromId(clubId: string): ClubCategory {
  if (clubId.includes('driver') || clubId.includes('w')) return 'Woods';
  if (clubId.includes('h')) return 'Hybrids';
  if (clubId.includes('i') || clubId.includes('pw')) return 'Irons';
  return 'Wedges';
}
