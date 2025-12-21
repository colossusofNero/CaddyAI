'use client';

/**
 * Profile Management Page
 *
 * Allows users to view and edit their golf profile
 * Includes the 5 core questions from mobile onboarding
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, User } from 'lucide-react';
import Link from 'next/link';
import { firebaseService } from '@/services/firebaseService';
import { initializeNewUser } from '@/services/initializationService';
import type { UserProfile } from '@/src/types/user';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Profile form state - 5 core questions
  const [dominantHand, setDominantHand] = useState<'right' | 'left'>('right');
  const [handicap, setHandicap] = useState<number>(18);
  const [typicalShotShape, setTypicalShotShape] = useState<'draw' | 'straight' | 'fade'>('straight');
  const [height, setHeight] = useState<number>(70); // inches
  const [curveTendency, setCurveTendency] = useState<number>(0); // -10 to +10

  // Optional fields
  const [yearsPlaying, setYearsPlaying] = useState<number | ''>('');
  const [playFrequency, setPlayFrequency] = useState<'weekly' | 'monthly' | 'occasionally' | 'rarely'>('monthly');
  const [driveDistance, setDriveDistance] = useState<number | ''>('');
  const [strengthLevel, setStrengthLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [improvementGoal, setImprovementGoal] = useState<string>('');
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Pro' | 'Tour Pro'>('Intermediate');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load existing profile
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await firebaseService.getUserProfile(user.uid);

        if (profile) {
          // Core fields
          setDominantHand(profile.dominantHand);
          setHandicap(profile.handicap);
          setTypicalShotShape(profile.typicalShotShape);
          setHeight(profile.height);
          setCurveTendency(profile.curveTendency);

          // Optional fields
          setYearsPlaying(profile.yearsPlaying ?? '');
          if (profile.playFrequency) setPlayFrequency(profile.playFrequency);
          setDriveDistance(profile.driveDistance ?? '');
          if (profile.strengthLevel) setStrengthLevel(profile.strengthLevel);
          if (profile.improvementGoal) setImprovementGoal(profile.improvementGoal);
          if (profile.skillLevel) setSkillLevel(profile.skillLevel);
        }
      } catch (err: unknown) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Build profile data, omitting undefined fields for Firebase
      const profileData: any = {
        userId: user.uid,
        dominantHand,
        handicap,
        typicalShotShape,
        height,
        curveTendency,
        playFrequency,
        strengthLevel,
        skillLevel, // For ElevenLabs AI question count
      };

      // Only add optional fields if they have values
      if (yearsPlaying !== '') {
        profileData.yearsPlaying = yearsPlaying;
      }
      if (driveDistance !== '') {
        profileData.driveDistance = driveDistance;
      }
      if (improvementGoal.trim() !== '') {
        profileData.improvementGoal = improvementGoal.trim();
      }

      await firebaseService.updateUserProfile(user.uid, profileData);

      // Initialize clubs, shots, and preferences for new users
      console.log('[Profile] Initializing user data...');
      const initResult = await initializeNewUser(user.uid, profileData as UserProfile);

      if (initResult.errors.length > 0) {
        console.error('[Profile] Initialization errors:', initResult.errors);
      } else {
        console.log('[Profile] ✓ User initialized:', {
          clubs: initResult.clubsInitialized,
          shots: initResult.shotsInitialized,
          preferences: initResult.preferencesInitialized,
        });
      }

      setSuccess(true);

      // Redirect to dashboard to see everything set up
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-secondary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span className="text-lg font-semibold text-text-primary">Profile</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="sr-only">Edit Your Golf Profile</h1>
        <form onSubmit={handleSubmit}>
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
              <p className="text-green-500 text-center font-medium">
                Profile saved successfully!
              </p>
              <p className="text-green-400 text-center text-sm mt-1">
                Setting up your clubs and shots...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
              <p className="text-red-500 text-center">{error}</p>
            </div>
          )}

          {/* Core Profile Information */}
          <Card variant="elevated" padding="lg" className="mb-6">
            <CardHeader
              title="Core Profile"
              description="These 5 questions help CaddyAI understand your game"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Dominant Hand */}
                <div>
                  <label id="dominant-hand-label" className="block text-sm font-medium text-text-primary mb-2">
                    Dominant Hand
                  </label>
                  <div className="grid grid-cols-2 gap-4" role="group" aria-labelledby="dominant-hand-label">
                    <button
                      type="button"
                      onClick={() => setDominantHand('right')}
                      aria-pressed={dominantHand === 'right'}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        dominantHand === 'right'
                          ? 'border-primary bg-primary bg-opacity-10 text-primary font-medium'
                          : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      Right
                    </button>
                    <button
                      type="button"
                      onClick={() => setDominantHand('left')}
                      aria-pressed={dominantHand === 'left'}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        dominantHand === 'left'
                          ? 'border-primary bg-primary bg-opacity-10 text-primary font-medium'
                          : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      Left
                    </button>
                  </div>
                </div>

                {/* Handicap */}
                <div>
                  <label htmlFor="handicap" className="block text-sm font-medium text-text-primary mb-2">
                    Handicap
                  </label>
                  <Input
                    id="handicap"
                    type="number"
                    min="0"
                    max="54"
                    value={handicap}
                    onChange={(e) => setHandicap(Number(e.target.value))}
                    required
                  />
                  <p className="mt-1 text-sm text-text-muted">Enter 0-54 or your best estimate</p>
                </div>

                {/* Shot Shape */}
                <div>
                  <label id="shot-shape-label" className="block text-sm font-medium text-text-primary mb-2">
                    Typical Shot Shape
                  </label>
                  <div className="grid grid-cols-3 gap-4" role="group" aria-labelledby="shot-shape-label">
                    {(['draw', 'straight', 'fade'] as const).map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => setTypicalShotShape(shape)}
                        aria-pressed={typicalShotShape === shape}
                        className={`p-4 rounded-lg border-2 transition-all capitalize ${
                          typicalShotShape === shape
                            ? 'border-primary bg-primary bg-opacity-10 text-primary font-medium'
                            : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-text-primary mb-2">
                    Height (inches)
                  </label>
                  <Input
                    id="height"
                    type="number"
                    min="48"
                    max="96"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    required
                  />
                  <p className="mt-1 text-sm text-text-muted">
                    {Math.floor(height / 12)}&apos;{height % 12}&quot;
                  </p>
                </div>

                {/* Curve Tendency */}
                <div>
                  <label htmlFor="curve" className="block text-sm font-medium text-text-primary mb-2">
                    Curve Tendency: {curveTendency > 0 ? `+${curveTendency}` : curveTendency}
                  </label>
                  <input
                    id="curve"
                    type="range"
                    min="-10"
                    max="10"
                    value={curveTendency}
                    onChange={(e) => setCurveTendency(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>Draw (-10)</span>
                    <span>Straight (0)</span>
                    <span>Fade (+10)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience (Optional) */}
          <Card variant="elevated" padding="lg" className="mb-6">
            <CardHeader
              title="Experience"
              description="Optional - helps personalize your experience"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Years Playing */}
                <div>
                  <label htmlFor="years" className="block text-sm font-medium text-text-primary mb-2">
                    Years Playing (optional)
                  </label>
                  <Input
                    id="years"
                    type="number"
                    min="0"
                    max="100"
                    value={yearsPlaying}
                    onChange={(e) => setYearsPlaying(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Enter years"
                  />
                </div>

                {/* Play Frequency */}
                <div>
                  <label id="play-frequency-label" className="block text-sm font-medium text-text-primary mb-2">
                    Play Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-4" role="group" aria-labelledby="play-frequency-label">
                    {(['weekly', 'monthly', 'occasionally', 'rarely'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setPlayFrequency(freq)}
                        aria-pressed={playFrequency === freq}
                        className={`p-4 rounded-lg border-2 transition-all capitalize ${
                          playFrequency === freq
                            ? 'border-primary bg-primary bg-opacity-10 text-primary font-medium'
                            : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills (Optional) */}
          <Card variant="elevated" padding="lg" className="mb-6">
            <CardHeader
              title="Skills"
              description="Optional - helps calibrate recommendations"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Drive Distance */}
                <div>
                  <label htmlFor="drive" className="block text-sm font-medium text-text-primary mb-2">
                    Average Drive Distance (yards)
                  </label>
                  <Input
                    id="drive"
                    type="number"
                    min="100"
                    max="400"
                    value={driveDistance}
                    onChange={(e) => setDriveDistance(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Enter yards"
                  />
                </div>

                {/* Strength Level */}
                <div>
                  <label id="strength-level-label" className="block text-sm font-medium text-text-primary mb-2">
                    Strength Level
                  </label>
                  <div className="grid grid-cols-3 gap-4" role="group" aria-labelledby="strength-level-label">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setStrengthLevel(level)}
                        aria-pressed={strengthLevel === level}
                        className={`p-4 rounded-lg border-2 transition-all capitalize ${
                          strengthLevel === level
                            ? 'border-primary bg-primary bg-opacity-10 text-primary font-medium'
                            : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skill Level - For ElevenLabs AI */}
                <div>
                  <label id="skill-level-label" className="block text-sm font-medium text-text-primary mb-2">
                    Golf Skill Level
                  </label>
                  <p className="text-sm text-text-muted mb-3">
                    Controls AI caddy question depth and complexity
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-labelledby="skill-level-label">
                    {(['Beginner', 'Intermediate', 'Advanced', 'Pro', 'Tour Pro'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSkillLevel(level)}
                        aria-pressed={skillLevel === level}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 text-sm ${
                          skillLevel === level
                            ? 'border-primary bg-primary bg-opacity-10 text-primary font-semibold shadow-md'
                            : 'border-neutral-300 text-neutral-700 hover:border-primary/50 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-text-muted italic">
                    Higher skill levels = more detailed analysis and advanced strategy questions
                  </p>
                </div>

                {/* Improvement Goal */}
                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-text-primary mb-2">
                    Improvement Goal
                  </label>
                  <textarea
                    id="goal"
                    value={improvementGoal}
                    onChange={(e) => setImprovementGoal(e.target.value)}
                    placeholder="What aspect of your game would you like to improve?"
                    className="w-full px-4 py-3 bg-secondary border border-secondary-700 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
