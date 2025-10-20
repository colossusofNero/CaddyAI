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
  const [yearsPlaying, setYearsPlaying] = useState<number | undefined>(undefined);
  const [playFrequency, setPlayFrequency] = useState<'weekly' | 'monthly' | 'occasionally' | 'rarely'>('monthly');
  const [driveDistance, setDriveDistance] = useState<number | undefined>(undefined);
  const [strengthLevel, setStrengthLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [improvementGoal, setImprovementGoal] = useState<string>('');

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
          if (profile.yearsPlaying) setYearsPlaying(profile.yearsPlaying);
          if (profile.playFrequency) setPlayFrequency(profile.playFrequency);
          if (profile.driveDistance) setDriveDistance(profile.driveDistance);
          if (profile.strengthLevel) setStrengthLevel(profile.strengthLevel);
          if (profile.improvementGoal) setImprovementGoal(profile.improvementGoal);
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

      const profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        dominantHand,
        handicap,
        typicalShotShape,
        height,
        curveTendency,
        yearsPlaying,
        playFrequency,
        driveDistance,
        strengthLevel,
        improvementGoal: improvementGoal || undefined,
      };

      await firebaseService.updateUserProfile(user.uid, profileData);
      setSuccess(true);

      // Redirect to clubs page if profile is new
      setTimeout(() => {
        router.push('/clubs');
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
        <form onSubmit={handleSubmit}>
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
              <p className="text-green-500 text-center">
                Profile saved successfully! Redirecting to club setup...
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
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Dominant Hand
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDominantHand('right')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        dominantHand === 'right'
                          ? 'border-primary bg-primary bg-opacity-10 text-primary'
                          : 'border-secondary-700 text-text-secondary hover:border-secondary-600'
                      }`}
                    >
                      Right
                    </button>
                    <button
                      type="button"
                      onClick={() => setDominantHand('left')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        dominantHand === 'left'
                          ? 'border-primary bg-primary bg-opacity-10 text-primary'
                          : 'border-secondary-700 text-text-secondary hover:border-secondary-600'
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
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Typical Shot Shape
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['draw', 'straight', 'fade'] as const).map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => setTypicalShotShape(shape)}
                        className={`p-4 rounded-lg border-2 transition-all capitalize ${
                          typicalShotShape === shape
                            ? 'border-primary bg-primary bg-opacity-10 text-primary'
                            : 'border-secondary-700 text-text-secondary hover:border-secondary-600'
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
                    {Math.floor(height / 12)}'{height % 12}"
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
                    value={yearsPlaying || ''}
                    onChange={(e) => setYearsPlaying(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Enter years"
                  />
                </div>

                {/* Play Frequency */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Play Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['weekly', 'monthly', 'occasionally', 'rarely'] as const).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setPlayFrequency(freq)}
                        className={`p-4 rounded-lg border-2 transition-all capitalize ${
                          playFrequency === freq
                            ? 'border-primary bg-primary bg-opacity-10 text-primary'
                            : 'border-secondary-700 text-text-secondary hover:border-secondary-600'
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
                    value={driveDistance || ''}
                    onChange={(e) => setDriveDistance(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Enter yards"
                  />
                </div>

                {/* Strength Level */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Strength Level
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setStrengthLevel(level)}
                        className={`p-4 rounded-lg border-2 transition-all capitalize ${
                          strengthLevel === level
                            ? 'border-primary bg-primary bg-opacity-10 text-primary'
                            : 'border-secondary-700 text-text-secondary hover:border-secondary-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
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

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
