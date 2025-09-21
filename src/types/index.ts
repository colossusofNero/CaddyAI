export interface User {
  id: string;
  email: string;
  name: string;
  subscription: SubscriptionTier;
  createdAt: Date;
}

export interface SubscriptionTier {
  level: 'free' | 'basic' | 'pro';
  active: boolean;
  expiresAt?: Date;
  features: {
    voiceInput: boolean;
    advancedAnalytics: boolean;
    unlimitedHistory: boolean;
    courseDatabase: boolean;
  };
}

export interface PlayerProfile {
  dominantHand: 'right' | 'left';
  handicap: number;
  naturalShot: 'draw' | 'fade' | 'straight';
  shotHeight: 'low' | 'medium' | 'high';
  setupComplete: boolean;
}

export interface Club {
  id: string;
  name: string;
  type: 'driver' | 'fairway' | 'hybrid' | 'iron' | 'wedge' | 'putter';
  loft: number;
  carryDistance: number;
  totalDistance: number;
  takebackOptions: TakebackOption[];
  faceOptions: FaceOption[];
}

export interface TakebackOption {
  type: 'full' | 'three_quarter' | 'half' | 'choke';
  distanceModifier: number;
}

export interface FaceOption {
  type: 'square' | 'open' | 'closed';
  directionModifier: number;
}

export interface ShortGameShot {
  distance: number;
  club: string;
  takeback: TakebackType;
  face: FaceType;
  technique: string;
  description: string;
}

export type TakebackType = 'full' | 'three_quarter' | 'half' | 'choke';
export type FaceType = 'square' | 'open' | 'closed';

export interface Conditions {
  windSpeed: number;
  windDirection: number;
  temperature: number;
  humidity: number;
  elevation: number;
  lie: 'tee' | 'fairway' | 'rough' | 'sand' | 'hardpan';
}

export interface ShotRecommendation {
  club: string;
  takeback: TakebackType;
  face: FaceType;
  adjustedDistance: number;
  confidence: number;
  reasoning: string;
  alternatives: Alternative[];
}

export interface Alternative {
  club: string;
  takeback: TakebackType;
  face: FaceType;
  adjustedDistance: number;
  confidence: number;
}

export interface ShotHistory {
  id: string;
  timestamp: Date;
  hole: number;
  course: string;
  targetDistance: number;
  conditions: Conditions;
  recommendation: ShotRecommendation;
  actualResult?: ShotResult;
}

export interface ShotResult {
  actualDistance: number;
  accuracy: 'left' | 'right' | 'short' | 'long' | 'on_target';
  satisfactory: boolean;
  notes?: string;
}

export interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error?: string;
}

export interface Analytics {
  totalShots: number;
  accuracy: number;
  favoriteClub: string;
  averageDistance: Record<string, number>;
  conditionsPerformance: Record<string, number>;
}