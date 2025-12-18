'use client';

/**
 * Club Management Page
 *
 * Manage 14 clubs with unlimited shot tracking per club
 * Simplified structure: id, name, distance, shots[]
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Plus, Trash2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { firebaseService } from '@/services/firebaseService';
import type { ClubData, Shot } from '@/src/types/user';

// Standard 14 club set
const DEFAULT_CLUBS: Omit<ClubData, 'id' | 'shots' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Driver', distance: 250 },
  { name: '3 Wood', distance: 230 },
  { name: '5 Wood', distance: 210 },
  { name: '3 Hybrid', distance: 200 },
  { name: '4 Iron', distance: 185 },
  { name: '5 Iron', distance: 175 },
  { name: '6 Iron', distance: 165 },
  { name: '7 Iron', distance: 155 },
  { name: '8 Iron', distance: 145 },
  { name: '9 Iron', distance: 130 },
  { name: 'PW', distance: 115 },
  { name: 'GW', distance: 100 },
  { name: 'SW', distance: 85 },
  { name: 'LW', distance: 70 },
];

export default function ClubsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [newShotDistance, setNewShotDistance] = useState<{ [key: string]: string }>({});

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
          // Initialize with default 14 clubs
          const now = Date.now();
          setClubs(
            DEFAULT_CLUBS.map((club, index) => ({
              id: `club_${now}_${index}`,
              ...club,
              shots: [],
              createdAt: now,
              updatedAt: now,
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

  const updateClub = (index: number, field: 'name' | 'distance', value: string | number) => {
    const newClubs = [...clubs];
    newClubs[index] = {
      ...newClubs[index],
      [field]: field === 'distance' ? Number(value) : value,
      updatedAt: Date.now(),
    };
    setClubs(newClubs);
  };

  const addClub = () => {
    if (clubs.length >= 14) {
      setError('Maximum 14 clubs allowed');
      return;
    }

    setClubs([
      ...clubs,
      {
        id: `club_${Date.now()}`,
        name: `Club ${clubs.length + 1}`,
        distance: 100,
        shots: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
  };

  const removeClub = (index: number) => {
    if (clubs.length <= 1) {
      setError('Must have at least one club');
      return;
    }
    setClubs(clubs.filter((_, i) => i !== index));
  };

  const addShot = async (clubIndex: number) => {
    if (!user) return;

    const club = clubs[clubIndex];
    const distance = Number(newShotDistance[club.id] || 0);

    if (distance <= 0 || distance > 400) {
      setError('Shot distance must be between 1 and 400 yards');
      return;
    }

    try {
      const shot: Omit<Shot, 'id' | 'createdAt'> = {
        distance,
        date: new Date().toISOString(),
      };

      const shotId = await firebaseService.addShot(user.uid, club.id, shot);

      // Update local state
      const newClubs = [...clubs];
      newClubs[clubIndex].shots.push({
        ...shot,
        id: shotId,
        createdAt: Date.now(),
      });
      setClubs(newClubs);
      setNewShotDistance({ ...newShotDistance, [club.id]: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to add shot:', err);
      setError('Failed to add shot');
    }
  };

  const deleteShot = async (clubIndex: number, shotId: string) => {
    if (!user) return;

    const club = clubs[clubIndex];

    try {
      await firebaseService.deleteShot(user.uid, club.id, shotId);

      // Update local state
      const newClubs = [...clubs];
      newClubs[clubIndex].shots = newClubs[clubIndex].shots.filter(s => s.id !== shotId);
      setClubs(newClubs);
    } catch (err) {
      console.error('Failed to delete shot:', err);
      setError('Failed to delete shot');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

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

  const getClubStats = (club: ClubData) => {
    if (club.shots.length === 0) {
      return { avg: club.distance, min: 0, max: 0, count: 0 };
    }

    const distances = club.shots.map(s => s.distance);
    const sum = distances.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / distances.length),
      min: Math.min(...distances),
      max: Math.max(...distances),
      count: club.shots.length,
    };
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
            <div className="w-20" />
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
                {saving ? 'Clubs saved successfully! Redirecting...' : 'Shot added successfully!'}
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
              description={`${clubs.length} of 14 clubs configured`}
            />
            <CardContent>
              <div className="space-y-4">
                {clubs.map((club, index) => {
                  const stats = getClubStats(club);
                  const isExpanded = expandedClub === club.id;

                  return (
                    <div
                      key={club.id}
                      className="p-4 bg-secondary-800 rounded-lg border border-secondary-700"
                    >
                      {/* Club Header */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

                        <div>
                          <label className="block text-xs font-medium text-text-muted mb-1">
                            Average Distance (yards)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="400"
                            value={club.distance}
                            onChange={(e) => updateClub(index, 'distance', e.target.value)}
                            required
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedClub(isExpanded ? null : club.id)}
                            className="w-full"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            {stats.count} Shots
                          </Button>
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeClub(index)}
                            className="w-full px-4 py-2 bg-red-500 bg-opacity-10 text-red-500 rounded-lg hover:bg-opacity-20 transition-colors flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Shot Stats */}
                      {stats.count > 0 && (
                        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-secondary rounded-lg">
                          <div className="text-center">
                            <div className="text-xs text-text-muted">Average</div>
                            <div className="text-lg font-bold text-primary">{stats.avg} yds</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-text-muted">Min - Max</div>
                            <div className="text-lg font-bold text-text-primary">
                              {stats.min} - {stats.max}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-text-muted">Total Shots</div>
                            <div className="text-lg font-bold text-text-primary">{stats.count}</div>
                          </div>
                        </div>
                      )}

                      {/* Shot History (Expanded) */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-secondary-700">
                          <h4 className="text-sm font-semibold text-text-primary mb-3">Shot History</h4>

                          {/* Add Shot Form */}
                          <div className="flex gap-2 mb-4">
                            <Input
                              type="number"
                              min="1"
                              max="400"
                              placeholder="Distance (yards)"
                              value={newShotDistance[club.id] || ''}
                              onChange={(e) =>
                                setNewShotDistance({
                                  ...newShotDistance,
                                  [club.id]: e.target.value,
                                })
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => addShot(index)}
                              disabled={!newShotDistance[club.id]}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Shot
                            </Button>
                          </div>

                          {/* Shot List */}
                          {club.shots.length === 0 ? (
                            <p className="text-sm text-text-muted text-center py-4">
                              No shots recorded yet
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {[...club.shots]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((shot) => (
                                  <div
                                    key={shot.id}
                                    className="flex items-center justify-between p-2 bg-secondary rounded"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg font-bold text-primary">
                                        {shot.distance} yds
                                      </span>
                                      <span className="text-xs text-text-muted">
                                        {new Date(shot.date).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => deleteShot(index, shot.id)}
                                      className="text-red-500 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Club Button */}
                {clubs.length < 14 && (
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
                    <strong className="text-text-primary">Average Distance:</strong> Set your expected distance for each club. This will be used for club recommendations.
                  </p>
                  <p>
                    <strong className="text-text-primary">Shot Tracking:</strong> Record actual shots to track your performance and improve distance accuracy over time.
                  </p>
                  <p className="pt-2 border-t border-secondary-700">
                    You can manage up to 14 clubs (standard golf bag limit) with unlimited shot tracking per club.
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
