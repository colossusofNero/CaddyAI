/**
 * Profile Service
 * Manages user profile data in Firestore
 * Syncs with React Native app profile structure
 */

import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, ClubSetDefinition } from '@/types/profile';

/**
 * Default club set definitions
 * Matches the React Native app structure
 */
export const DEFAULT_CLUB_SETS: ClubSetDefinition[] = [
  {
    id: 'beginner',
    name: 'Beginner Set',
    description: '8 essential clubs to get started',
    clubs: ['DR', '3W', '5H', '6I', '7I', '8I', '9I', 'PW'],
    skillLevel: 'beginner',
  },
  {
    id: 'intermediate',
    name: 'Intermediate Set',
    description: '11 clubs for improving players',
    clubs: ['DR', '3W', '5W', '4H', '5I', '6I', '7I', '8I', '9I', 'PW', 'SW'],
    skillLevel: 'intermediate',
  },
  {
    id: 'advanced',
    name: 'Advanced Set',
    description: '14 clubs for serious golfers',
    clubs: ['DR', '3W', '5W', '3H', '4I', '5I', '6I', '7I', '8I', '9I', 'PW', 'SW', 'LW', 'PT'],
    skillLevel: 'advanced',
  },
];

/**
 * Sensible defaults for new profiles
 */
export const DEFAULT_PROFILE_SETTINGS = {
  shotShape: 'straight' as const,
  handedness: 'right' as const,
  clubSet: 'intermediate',
  skillLevel: 'intermediate' as const,
  preferences: {
    units: 'imperial' as const,
    voiceEnabled: true,
    notifications: true,
  },
};

/**
 * Create a new user profile
 */
export async function createProfile(
  userId: string,
  data: {
    email?: string;
    name?: string;
    shotShape?: string;
    handedness?: string;
    clubSet?: string;
    onboardingDuration?: number;
  }
): Promise<UserProfile> {
  const clubSetDefinition =
    DEFAULT_CLUB_SETS.find((set) => set.id === data.clubSet) || DEFAULT_CLUB_SETS[1];

  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
    createdAt: any;
    updatedAt: any;
  } = {
    id: userId,
    email: data.email,
    name: data.name,
    shotShape: (data.shotShape as UserProfile['shotShape']) || DEFAULT_PROFILE_SETTINGS.shotShape,
    handedness:
      (data.handedness as UserProfile['handedness']) || DEFAULT_PROFILE_SETTINGS.handedness,
    clubSet: data.clubSet || DEFAULT_PROFILE_SETTINGS.clubSet,
    clubs: clubSetDefinition.clubs,
    skillLevel: clubSetDefinition.skillLevel,
    preferences: DEFAULT_PROFILE_SETTINGS.preferences,
    onboardingCompletedAt: new Date().toISOString(),
    onboardingDuration: data.onboardingDuration,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'profiles', userId), profile);

  return {
    ...profile,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get user profile from Firestore
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profileDoc = await getDoc(doc(db, 'profiles', userId));

    if (!profileDoc.exists()) {
      return null;
    }

    const data = profileDoc.data();

    return {
      id: profileDoc.id,
      email: data.email || null,
      name: data.name || null,
      shotShape: data.shotShape || 'straight',
      handedness: data.handedness || 'right',
      clubSet: data.clubSet || 'intermediate',
      clubs: data.clubs || [],
      skillLevel: data.skillLevel || 'intermediate',
      preferences: data.preferences || DEFAULT_PROFILE_SETTINGS.preferences,
      onboardingCompletedAt: data.onboardingCompletedAt || null,
      onboardingDuration: data.onboardingDuration || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'profiles', userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
}

/**
 * Update user's club set
 */
export async function updateClubSet(userId: string, clubSetId: string): Promise<void> {
  const clubSetDefinition = DEFAULT_CLUB_SETS.find((set) => set.id === clubSetId);

  if (!clubSetDefinition) {
    throw new Error('Invalid club set ID');
  }

  await updateProfile(userId, {
    clubSet: clubSetId,
    clubs: clubSetDefinition.clubs,
    skillLevel: clubSetDefinition.skillLevel,
  });
}

/**
 * Update individual clubs in user's bag
 */
export async function updateClubs(userId: string, clubs: string[]): Promise<void> {
  await updateProfile(userId, { clubs });
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return profile !== null && profile.onboardingCompletedAt !== null;
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(userId: string, duration?: number): Promise<void> {
  await updateProfile(userId, {
    onboardingCompletedAt: new Date().toISOString(),
    onboardingDuration: duration,
  });
}

/**
 * Get user's clubs with metadata
 */
export async function getClubsWithMetadata(userId: string): Promise<
  {
    club: string;
    category: string;
    loft?: number;
    distance?: number;
  }[]
> {
  const profile = await getProfile(userId);
  if (!profile) {
    return [];
  }

  // Basic club metadata
  const clubMetadata: Record<
    string,
    { category: string; loft?: number; distance?: number }
  > = {
    DR: { category: 'Driver', loft: 10.5, distance: 250 },
    '3W': { category: 'Fairway Wood', loft: 15, distance: 220 },
    '5W': { category: 'Fairway Wood', loft: 18, distance: 200 },
    '3H': { category: 'Hybrid', loft: 19, distance: 190 },
    '4H': { category: 'Hybrid', loft: 22, distance: 180 },
    '5H': { category: 'Hybrid', loft: 25, distance: 170 },
    '3I': { category: 'Iron', loft: 21, distance: 185 },
    '4I': { category: 'Iron', loft: 24, distance: 175 },
    '5I': { category: 'Iron', loft: 27, distance: 165 },
    '6I': { category: 'Iron', loft: 31, distance: 155 },
    '7I': { category: 'Iron', loft: 35, distance: 145 },
    '8I': { category: 'Iron', loft: 39, distance: 135 },
    '9I': { category: 'Iron', loft: 43, distance: 125 },
    PW: { category: 'Wedge', loft: 47, distance: 115 },
    SW: { category: 'Wedge', loft: 56, distance: 80 },
    LW: { category: 'Wedge', loft: 60, distance: 60 },
    PT: { category: 'Putter', distance: 0 },
  };

  return profile.clubs.map((club) => ({
    club,
    ...(clubMetadata[club] || { category: 'Unknown' }),
  }));
}
