/**
 * Club Types
 * Matches the structure used in React Native app
 */

export type ClubType =
  | 'Driver'
  | '3 Wood'
  | '5 Wood'
  | '3 Hybrid'
  | '4 Hybrid'
  | '5 Hybrid'
  | '3 Iron'
  | '4 Iron'
  | '5 Iron'
  | '6 Iron'
  | '7 Iron'
  | '8 Iron'
  | '9 Iron'
  | 'PW'
  | 'GW'
  | 'SW'
  | 'LW';

export type Takeback = 'Full' | '3/4' | '1/2' | '1/4' | 'Pitch' | 'Chip' | 'Flop';
export type Face = 'Draw' | 'Square' | 'Fade' | 'Hood' | 'Open' | 'Flat';

export interface Club {
  name: ClubType | string;
  club: ClubType | string; // Alias for name (backwards compatibility)
  takeback: Takeback;
  face: Face;
  carryYards: number; // Also stored as carryDistance in some places
  carryDistance?: number; // Alias
  distance?: number; // Alias

  // Optional metadata
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubDatabase {
  clubs: Club[];
  userId: string;
  lastModified?: string;
}

// Default club distances (for new users)
export const DEFAULT_CLUBS: Omit<Club, 'userId'>[] = [
  { name: 'Driver', club: 'Driver', takeback: 'Full', face: 'Square', carryYards: 230 },
  { name: '3 Wood', club: '3 Wood', takeback: 'Full', face: 'Square', carryYards: 210 },
  { name: '5 Wood', club: '5 Wood', takeback: 'Full', face: 'Square', carryYards: 195 },
  { name: '3 Hybrid', club: '3 Hybrid', takeback: 'Full', face: 'Square', carryYards: 185 },
  { name: '4 Iron', club: '4 Iron', takeback: 'Full', face: 'Square', carryYards: 175 },
  { name: '5 Iron', club: '5 Iron', takeback: 'Full', face: 'Square', carryYards: 165 },
  { name: '6 Iron', club: '6 Iron', takeback: 'Full', face: 'Square', carryYards: 155 },
  { name: '7 Iron', club: '7 Iron', takeback: 'Full', face: 'Square', carryYards: 145 },
  { name: '8 Iron', club: '8 Iron', takeback: 'Full', face: 'Square', carryYards: 135 },
  { name: '9 Iron', club: '9 Iron', takeback: 'Full', face: 'Square', carryYards: 125 },
  { name: 'PW', club: 'PW', takeback: 'Full', face: 'Square', carryYards: 115 },
  { name: 'GW', club: 'GW', takeback: 'Full', face: 'Square', carryYards: 100 },
  { name: 'SW', club: 'SW', takeback: 'Full', face: 'Square', carryYards: 85 },
  { name: 'LW', club: 'LW', takeback: 'Full', face: 'Square', carryYards: 70 },
];
