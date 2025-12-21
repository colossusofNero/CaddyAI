'use client';

/**
 * Club Management Page
 *
 * Manage clubs using unified Firebase schema
 * Clubs store: name, face, carryYards, rollYards, totalYards
 * Shots are managed separately in /shots collection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Plus, Trash2, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { firebaseService } from '@/services/firebaseService';
import type { Club, ClubFace } from '@/src/types/clubs';
import { generateDefaultClubs, CLUB_LIST } from '@/src/types/clubs';
import { downloadExcelTemplate, parseExcelFile } from '@/lib/excelImportExport';

const FACE_OPTIONS: { value: ClubFace; label: string }[] = [
  { value: 'Square', label: 'Square' },
  { value: 'Draw', label: 'Draw' },
  { value: 'Fade', label: 'Fade' },
];

export default function ClubsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const clubsDoc = await firebaseService.getUserClubs(user.uid);

        if (clubsDoc && clubsDoc.clubs.length > 0) {
          // Migrate old clubs to add roll yards if missing
          const migratedClubs = clubsDoc.clubs.map(club => ({
            ...club,
            rollYards: club.rollYards ?? 5, // Default to 5 yards if not set
            totalYards: club.carryYards + (club.rollYards ?? 5),
          }));
          setClubs(migratedClubs);
        } else {
          // Initialize with default 14 clubs based on handicap
          // For now, use default handicap of 15 and Square face
          const defaultClubs = generateDefaultClubs(15, 'Square');
          // Take first 14 clubs
          setClubs(defaultClubs.slice(0, 14));
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

  const updateClub = useCallback((index: number, updates: Partial<Club>) => {
    setClubs(prevClubs => {
      const newClubs = [...prevClubs];
      const club = newClubs[index];

      newClubs[index] = {
        ...club,
        ...updates,
      };

      // Recalculate totalYards if carry or roll changed
      if (updates.carryYards !== undefined || updates.rollYards !== undefined) {
        newClubs[index].totalYards = newClubs[index].carryYards + newClubs[index].rollYards;
      }

      // DO NOT SORT during editing - maintain order
      return newClubs;
    });
  }, []);

  const addClub = () => {
    if (clubs.length >= 14) {
      setError('Maximum 14 clubs allowed');
      return;
    }

    const newClub: Club = {
      id: `club_custom_${Date.now()}`,
      name: `Club ${clubs.length + 1}`,
      face: 'Square',
      carryYards: 100,
      rollYards: 5,
      totalYards: 105,
      sortOrder: clubs.length + 1,
      isDefault: false,
      isActive: true,
    };

    setClubs([...clubs, newClub]);
  };

  const removeClub = (index: number) => {
    if (clubs.length <= 1) {
      setError('You must have at least one club.');
      return;
    }

    setClubs(clubs.filter((_, i) => i !== index));
  };

  const resetToDefaults = async () => {
    if (!confirm('Reset all clubs to defaults? This will remove custom clubs and reset all distances.')) {
      return;
    }

    const defaultClubs = generateDefaultClubs(15, 'Square');
    setClubs(defaultClubs.slice(0, 14));
  };

  const handleDownloadTemplate = () => {
    try {
      // Download template with current clubs and empty shots
      downloadExcelTemplate(clubs, []);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to download template:', err);
      setError('Failed to download template. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const result = await parseExcelFile(file);

      if (result.errors.length > 0) {
        setError(`Import errors:\n${result.errors.join('\n')}`);
        setLoading(false);
        return;
      }

      if (result.clubs.length === 0) {
        setError('No clubs found in Excel file');
        setLoading(false);
        return;
      }

      if (result.clubs.length > 14) {
        setError('Too many clubs. Maximum 14 allowed.');
        setLoading(false);
        return;
      }

      // Convert partial clubs to full clubs with required fields
      const importedClubs: Club[] = result.clubs.map((club, index) => ({
        id: `club_imported_${Date.now()}_${index}`,
        name: club.name!,
        face: club.face!,
        carryYards: club.carryYards!,
        rollYards: club.rollYards!,
        totalYards: club.totalYards!,
        sortOrder: index + 1,
        isDefault: false,
        isActive: true,
      }));

      setClubs(importedClubs);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to import clubs:', err);
      setError('Failed to import clubs. Please check the file format.');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      // Sort clubs by totalYards (descending) before saving
      const sortedClubs = [...clubs].sort((a, b) => b.totalYards - a.totalYards);

      await firebaseService.updateUserClubs(user.uid, sortedClubs);

      // Update local state with sorted clubs
      setClubs(sortedClubs);

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
              <span className="text-lg font-semibold text-text-primary">Club Management</span>
              <Link href="/shots">
                <button className="px-4 py-2 text-sm border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                  Manage Shots
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
                Clubs saved successfully! Redirecting...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
              <p className="text-red-500 text-center whitespace-pre-line">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs text-red-400 hover:text-red-300 mt-2 block mx-auto"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Import/Export Section */}
          <Card variant="default" padding="lg" className="mb-6">
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Import/Export Clubs
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Download your clubs as an Excel template or upload a filled template to import
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" padding="lg" className="mb-6">
            <CardHeader
              title="Your Clubs"
              description={`${clubs.length} clubs configured`}
            />
            <CardContent>
              <div className="space-y-4">
                {clubs.map((club, index) => (
                  <div
                    key={`club-${index}`}
                    className="p-4 bg-secondary-800 rounded-lg border border-secondary-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Club Name */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Club Name
                        </label>
                        <Input
                          value={club.name}
                          onChange={(e) => updateClub(index, { name: e.target.value })}
                          placeholder="e.g., Driver"
                          required
                        />
                      </div>

                      {/* Face */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Face
                        </label>
                        <select
                          value={club.face}
                          onChange={(e) => updateClub(index, { face: e.target.value as ClubFace })}
                          className="w-full px-3 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {FACE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Carry (yards) */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Carry (yards)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="400"
                          value={club.carryYards}
                          onChange={(e) => updateClub(index, { carryYards: Number(e.target.value) })}
                          required
                        />
                      </div>

                      {/* Roll (yards) */}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Roll (yards)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={club.rollYards}
                          onChange={(e) => updateClub(index, { rollYards: Number(e.target.value) })}
                          required
                        />
                        <div className="text-xs text-text-muted mt-1">
                          Total: {club.totalYards} yds
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeClub(index)}
                          className="w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 bg-red-500 bg-opacity-10 text-red-500 hover:bg-opacity-20"
                          title="Remove club"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Club Button */}
                {clubs.length < 14 && (
                  <button
                    type="button"
                    onClick={addClub}
                    className="w-full p-4 border-2 border-dashed border-secondary-700 rounded-lg text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Club (Max 14)
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
                    <strong className="text-text-primary">Face:</strong> Your natural shot shape with this club (Square, Draw, or Fade).
                  </p>
                  <p>
                    <strong className="text-text-primary">Carry:</strong> Where the ball lands before rolling (in yards).
                  </p>
                  <p>
                    <strong className="text-text-primary">Roll:</strong> How far the ball rolls after landing (in yards).
                  </p>
                  <p className="pt-2 border-t border-secondary-700">
                    You can manage up to 14 clubs (standard golf bag limit). Default clubs cannot be deleted but can be customized.
                  </p>
                  <p>
                    <strong className="text-text-primary">Shot Variations:</strong> Manage different shot types (knockdown, punch, flop, etc.) in the Shots section.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={resetToDefaults}
              className="px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              Reset to Defaults
            </button>
            <div className="flex gap-4">
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
                className="px-6 py-3 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Clubs'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
