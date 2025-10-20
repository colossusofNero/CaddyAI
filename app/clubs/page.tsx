'use client';

/**
 * Club Management Page
 *
 * Allows users to manage their 26 clubs with distances and shot variations
 * Matches mobile app structure: takeback, face, carryYards
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { firebaseService } from '@/services/firebaseService';
import type { ClubData } from '@/src/types/user';

// Standard club set (14 clubs)
const DEFAULT_CLUBS: Omit<ClubData, 'carryYards'>[] = [
  { name: 'Driver', takeback: 'Full', face: 'Square' },
  { name: '3 Wood', takeback: 'Full', face: 'Square' },
  { name: '5 Wood', takeback: 'Full', face: 'Square' },
  { name: '3 Hybrid', takeback: 'Full', face: 'Square' },
  { name: '4 Iron', takeback: 'Full', face: 'Square' },
  { name: '5 Iron', takeback: 'Full', face: 'Square' },
  { name: '6 Iron', takeback: 'Full', face: 'Square' },
  { name: '7 Iron', takeback: 'Full', face: 'Square' },
  { name: '8 Iron', takeback: 'Full', face: 'Square' },
  { name: '9 Iron', takeback: 'Full', face: 'Square' },
  { name: 'PW', takeback: 'Full', face: 'Square' },
  { name: 'GW', takeback: 'Full', face: 'Square' },
  { name: 'SW', takeback: 'Full', face: 'Square' },
  { name: 'LW', takeback: 'Full', face: 'Square' },
];

export default function ClubsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clubs, setClubs] = useState<ClubData[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load existing clubs
  useEffect(() => {
    if (!user) return;

    const loadClubs = async () => {
      try {
        setLoading(true);
        const existingClubs = await firebaseService.getUserClubs(user.uid);

        if (existingClubs && existingClubs.clubs.length > 0) {
          setClubs(existingClubs.clubs);
        } else {
          // Initialize with default clubs at 0 yards
          setClubs(
            DEFAULT_CLUBS.map((club) => ({
              ...club,
              carryYards: 0,
              updatedAt: Date.now(),
            }))
          );
        }
      } catch (err: unknown) {
        console.error('Failed to load clubs:', err);
        setError('Failed to load club data');
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, [user]);

  const updateClub = (index: number, field: keyof ClubData, value: string | number) => {
    const newClubs = [...clubs];
    newClubs[index] = {
      ...newClubs[index],
      [field]: value,
      updatedAt: Date.now(),
    };
    setClubs(newClubs);
  };

  const addClub = () => {
    setClubs([
      ...clubs,
      {
        name: `Club ${clubs.length + 1}`,
        takeback: 'Full',
        face: 'Square',
        carryYards: 0,
        updatedAt: Date.now(),
      },
    ]);
  };

  const removeClub = (index: number) => {
    setClubs(clubs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validate at least one club
    if (clubs.length === 0) {
      setError('Please add at least one club');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await firebaseService.updateUserClubs(user.uid, clubs);
      setSuccess(true);

      // Redirect to dashboard after save
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to save clubs:', err);
      setError('Failed to save clubs. Please try again.');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-text-primary">Club Management</span>
            </div>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
              <p className="text-green-500 text-center">
                Clubs saved successfully! Redirecting to dashboard...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
              <p className="text-red-500 text-center">{error}</p>
            </div>
          )}

          <Card variant="elevated" padding="lg" className="mb-6">
            <CardHeader
              title="Your Clubs"
              description={`${clubs.length} ${clubs.length === 1 ? 'club' : 'clubs'} configured`}
            />
            <CardContent>
              <div className="space-y-4">
                {clubs.map((club, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-secondary-800 rounded-lg border border-secondary-700"
                  >
                    {/* Club Name */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Club Name
                      </label>
                      <Input
                        value={club.name}
                        onChange={(e) => updateClub(index, 'name', e.target.value)}
                        placeholder="e.g., Driver"
                        required
                      />
                    </div>

                    {/* Takeback */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Takeback
                      </label>
                      <select
                        value={club.takeback}
                        onChange={(e) => updateClub(index, 'takeback', e.target.value)}
                        className="w-full px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      >
                        <option value="Full">Full</option>
                        <option value="3/4">3/4</option>
                        <option value="1/2">1/2</option>
                        <option value="1/4">1/4</option>
                        <option value="Pitch">Pitch</option>
                        <option value="Chip">Chip</option>
                        <option value="Flop">Flop</option>
                      </select>
                    </div>

                    {/* Face */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Face
                      </label>
                      <select
                        value={club.face}
                        onChange={(e) => updateClub(index, 'face', e.target.value)}
                        className="w-full px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      >
                        <option value="Square">Square</option>
                        <option value="Draw">Draw</option>
                        <option value="Fade">Fade</option>
                        <option value="Hood">Hood</option>
                        <option value="Open">Open</option>
                        <option value="Flat">Flat</option>
                      </select>
                    </div>

                    {/* Carry Distance */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Carry (yards)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="400"
                        value={club.carryYards}
                        onChange={(e) => updateClub(index, 'carryYards', Number(e.target.value))}
                        required
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeClub(index)}
                        className="w-full md:w-auto px-4 py-2 bg-red-500 bg-opacity-10 text-red-500 rounded-lg hover:bg-opacity-20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="md:hidden">Remove</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Club Button */}
                {clubs.length < 26 && (
                  <button
                    type="button"
                    onClick={addClub}
                    className="w-full p-4 border-2 border-dashed border-secondary-700 rounded-lg text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Club
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card variant="default" padding="lg" className="mb-6">
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-primary">About Club Management</h3>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p>
                    <strong className="text-text-primary">Takeback:</strong> How far back you take the club (Full swing, 3/4 swing, etc.)
                  </p>
                  <p>
                    <strong className="text-text-primary">Face:</strong> The clubface position at impact (Square, Draw, Fade, Hood, Open, Flat)
                  </p>
                  <p>
                    <strong className="text-text-primary">Carry:</strong> Average distance the ball carries in the air before landing
                  </p>
                  <p className="pt-2 border-t border-secondary-700">
                    You can add up to 26 different club/shot combinations to cover all your options on the course. The mobile app will sync these clubs automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
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
                  Save Clubs
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
