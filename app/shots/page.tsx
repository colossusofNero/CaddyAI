'use client';

/**
 * Shots Management Page
 *
 * Manage shot variations using unified Firebase schema
 * Shots store: clubId, clubName, name, takeback, face, carryYards, rollYards, totalYards
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Plus, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { firebaseService } from '@/services/firebaseService';
import type { Shot, ShotFace, Takeback, ShotName } from '@/src/types/shots';
import { SHOT_NAMES, TAKEBACK_OPTIONS, FACE_OPTIONS as SHOT_FACE_OPTIONS, generateShotId, getShotCategory } from '@/src/types/shots';
import type { Club } from '@/src/types/clubs';

export default function ShotsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [editingShot, setEditingShot] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterClub, setFilterClub] = useState<string>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load clubs and shots
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load clubs
        const clubsDoc = await firebaseService.getUserClubs(user.uid);
        if (clubsDoc && clubsDoc.clubs.length > 0) {
          setClubs(clubsDoc.clubs);
        }

        // Load shots
        const shotsDoc = await firebaseService.getUserShots(user.uid);
        if (shotsDoc && shotsDoc.shots.length > 0) {
          setShots(shotsDoc.shots);
        }
      } catch (err: unknown) {
        console.error('Failed to load data:', err);
        setError('Failed to load shot data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const updateShot = useCallback((id: string, updates: Partial<Shot>) => {
    setShots(prevShots => prevShots.map(shot => {
      if (shot.id !== id) return shot;

      const updated = { ...shot, ...updates };

      // Recalculate totalYards if carry or roll changed
      if (updates.carryYards !== undefined || updates.rollYards !== undefined) {
        updated.totalYards = updated.carryYards + updated.rollYards;
        updated.category = getShotCategory(updated.totalYards);
      }

      return updated;
    }));
  }, []);

  const addShot = () => {
    if (clubs.length === 0) {
      setError('Please add clubs first before creating shots');
      return;
    }

    const firstClub = clubs[0];
    const newShot: Shot = {
      id: generateShotId(firstClub.id, 'custom'),
      clubId: firstClub.id,
      clubName: firstClub.name,
      name: 'Standard',
      category: 'full-swing',
      takeback: 'Full',
      face: 'Square',
      carryYards: firstClub.carryYards,
      rollYards: firstClub.rollYards,
      totalYards: firstClub.totalYards,
      sortOrder: shots.length + 1,
      isDefault: false,
      isActive: true,
    };

    setShots([...shots, newShot]);
    setEditingShot(newShot.id);
    setShowAddForm(false);
  };

  const removeShot = (id: string) => {
    const shot = shots.find(s => s.id === id);

    // Prevent deleting default shots without confirmation
    if (shot?.isDefault) {
      if (!confirm('Delete this default shot? This action cannot be undone.')) {
        return;
      }
    }

    setShots(shots.filter(s => s.id !== id));
    if (editingShot === id) {
      setEditingShot(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await firebaseService.updateUserShots(user.uid, shots);
      setSuccess(true);
      setEditingShot(null);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Failed to save shots:', err);
      setError('Failed to save shots. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredShots = filterClub === 'all'
    ? shots
    : shots.filter(s => s.clubId === filterClub);

  // Group shots by category
  const fullSwingShots = filteredShots.filter(s => s.category === 'full-swing');
  const shortGameShots = filteredShots.filter(s => s.category === 'short-game');

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
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-text-primary">Shot Management</span>
              <Link href="/clubs">
                <button className="px-4 py-2 text-sm border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                  Manage Clubs
                </button>
              </Link>
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
                Shots saved successfully!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
              <p className="text-red-500 text-center">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs text-red-400 hover:text-red-300 mt-2 block mx-auto"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="mb-6 flex gap-4 items-center">
            <label className="text-sm font-medium text-text-muted">Filter by Club:</label>
            <select
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
              className="px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Clubs</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              onClick={addShot}
              className="ml-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Shot
            </Button>
          </div>

          {/* Full Swing Shots */}
          {fullSwingShots.length > 0 && (
            <Card variant="elevated" padding="lg" className="mb-6">
              <CardHeader
                title="Full Swing Shots"
                description={`${fullSwingShots.length} shots configured`}
              />
              <CardContent>
                <ShotList
                  shots={fullSwingShots}
                  clubs={clubs}
                  editingShot={editingShot}
                  onEdit={setEditingShot}
                  onUpdate={updateShot}
                  onRemove={removeShot}
                />
              </CardContent>
            </Card>
          )}

          {/* Short Game Shots */}
          {shortGameShots.length > 0 && (
            <Card variant="elevated" padding="lg" className="mb-6">
              <CardHeader
                title="Short Game Shots"
                description={`${shortGameShots.length} shots configured`}
              />
              <CardContent>
                <ShotList
                  shots={shortGameShots}
                  clubs={clubs}
                  editingShot={editingShot}
                  onEdit={setEditingShot}
                  onUpdate={updateShot}
                  onRemove={removeShot}
                />
              </CardContent>
            </Card>
          )}

          {shots.length === 0 && (
            <Card variant="default" padding="lg" className="mb-6">
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-text-muted mb-4">No shots configured yet.</p>
                  <Button type="button" onClick={addShot}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Shot
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card variant="default" padding="lg" className="mb-6">
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-primary">About Shot Management</h3>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p>
                    <strong className="text-text-primary">Shots:</strong> Different ways to hit each club (standard, knockdown, punch, flop, etc.).
                  </p>
                  <p>
                    <strong className="text-text-primary">Takeback:</strong> How far back you take the club (Full, 3/4, 1/2, 1/4, Chip, Flop).
                  </p>
                  <p>
                    <strong className="text-text-primary">Face:</strong> Club face angle (Square, Draw, Fade, Hood, Open, Flat).
                  </p>
                  <p>
                    <strong className="text-text-primary">Roll:</strong> Can be negative for backspin shots (e.g., flop shots).
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
                  Save Shots
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

// Shot List Component
function ShotList({
  shots,
  clubs,
  editingShot,
  onEdit,
  onUpdate,
  onRemove,
}: {
  shots: Shot[];
  clubs: Club[];
  editingShot: string | null;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<Shot>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {shots.map((shot) => {
        const isEditing = editingShot === shot.id;

        return (
          <div
            key={shot.id}
            className="p-4 bg-secondary-800 rounded-lg border border-secondary-700"
          >
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Club Selection */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Club
                    </label>
                    <select
                      value={shot.clubId}
                      onChange={(e) => {
                        const club = clubs.find(c => c.id === e.target.value);
                        if (club) {
                          onUpdate(shot.id, { clubId: club.id, clubName: club.name });
                        }
                      }}
                      className="w-full px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {clubs.map(club => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shot Name */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Shot Name
                    </label>
                    <select
                      value={shot.name}
                      onChange={(e) => onUpdate(shot.id, { name: e.target.value as ShotName })}
                      className="w-full px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {SHOT_NAMES.map(name => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Takeback */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Takeback
                    </label>
                    <select
                      value={shot.takeback}
                      onChange={(e) => onUpdate(shot.id, { takeback: e.target.value as Takeback })}
                      className="w-full px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {TAKEBACK_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Face */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Face
                    </label>
                    <select
                      value={shot.face}
                      onChange={(e) => onUpdate(shot.id, { face: e.target.value as ShotFace })}
                      className="w-full px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {SHOT_FACE_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Carry */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Carry (yards)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="400"
                      value={shot.carryYards}
                      onChange={(e) => onUpdate(shot.id, { carryYards: Number(e.target.value) })}
                      required
                    />
                  </div>

                  {/* Roll */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Roll (yards)
                    </label>
                    <Input
                      type="number"
                      min="-20"
                      max="100"
                      value={shot.rollYards}
                      onChange={(e) => onUpdate(shot.id, { rollYards: Number(e.target.value) })}
                      required
                    />
                    <div className="text-xs text-text-muted mt-1">
                      Total: {shot.totalYards} yds
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onEdit(null)}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Club:</span>
                    <div className="font-medium text-text-primary">{shot.clubName}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Shot:</span>
                    <div className="font-medium text-text-primary">{shot.name}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Takeback:</span>
                    <div className="font-medium text-text-primary">{shot.takeback}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Face:</span>
                    <div className="font-medium text-text-primary">{shot.face}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Distance:</span>
                    <div className="font-medium text-primary">
                      {shot.carryYards}+{shot.rollYards} = {shot.totalYards} yds
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => onEdit(shot.id)}
                      className="p-2 text-primary hover:bg-primary hover:bg-opacity-10 rounded transition-colors"
                      title="Edit shot"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(shot.id)}
                      className="p-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded transition-colors"
                      title="Delete shot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
