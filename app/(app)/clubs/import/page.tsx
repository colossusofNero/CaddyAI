'use client';

/**
 * Import Stats Page
 *
 * Standalone page reached from the dashboard "Import Stats" button.
 * Lets the user download an Excel template and upload a filled template to
 * import their clubs and shots, persisting both to Firebase.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { firebaseService } from '@/services/firebaseService';
import { downloadExcelTemplate, parseExcelFile } from '@/lib/excelImportExport';
import type { Club } from '@/src/types/clubs';
import type { Shot } from '@/src/types/shots';
import { generateShotId, getShotCategory } from '@/src/types/shots';

export default function ImportStatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ clubs: number; shots: number } | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load existing clubs and shots so the downloaded template is pre-filled
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const clubsDoc = await firebaseService.getUserClubs(user.uid);
      if (clubsDoc && clubsDoc.clubs.length > 0) {
        setClubs(clubsDoc.clubs);
      }
      const shotsDoc = await firebaseService.getUserShots(user.uid);
      if (shotsDoc && shotsDoc.shots.length > 0) {
        setShots(shotsDoc.shots);
      }
    } catch (err) {
      console.error('Failed to load existing data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate(clubs, shots);
    } catch (err) {
      console.error('Failed to download template:', err);
      setError('Failed to download template. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setImporting(true);
      setError(null);
      setSummary(null);

      const result = await parseExcelFile(file);

      if (result.errors.length > 0) {
        setError(`Import errors:\n${result.errors.join('\n')}`);
        return;
      }

      if (result.clubs.length === 0 && result.shots.length === 0) {
        setError('No data found in the Excel file.');
        return;
      }

      // Build imported clubs with deterministic ids
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

      // Build imported shots, resolving clubId by matching club name
      const importedShots: Shot[] = result.shots.map((shot, index) => {
        const matchingClub =
          importedClubs.find((c) => c.name === shot.clubName) ||
          clubs.find((c) => c.name === shot.clubName);
        const clubId = matchingClub
          ? matchingClub.id
          : `club_unknown_${Date.now()}_${index}`;

        return {
          id: generateShotId(clubId, shot.name!),
          clubId,
          clubName: shot.clubName!,
          name: shot.name!,
          category: getShotCategory(shot.totalYards!),
          takeback: shot.takeback!,
          face: shot.face!,
          carryYards: shot.carryYards!,
          rollYards: shot.rollYards!,
          totalYards: shot.totalYards!,
          sortOrder: index + 1,
          isDefault: false,
          isActive: true,
        };
      });

      // Persist to Firebase
      if (importedClubs.length > 0) {
        await firebaseService.updateUserClubs(user.uid, importedClubs);
        setClubs(importedClubs);
      }
      if (importedShots.length > 0) {
        await firebaseService.updateUserShots(user.uid, importedShots);
        setShots(importedShots);
      }

      setSummary({ clubs: importedClubs.length, shots: importedShots.length });
    } catch (err) {
      console.error('Failed to import data:', err);
      setError('Failed to import data. Please check the file format and try again.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
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
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Import Stats</h1>
          <p className="text-text-secondary mt-1">
            Download the Excel template, fill in your clubs and shots, then upload it to
            import your stats.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-error bg-opacity-10 border border-error border-opacity-30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <p className="text-error text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Success summary */}
        {summary && (
          <div className="mb-6 p-4 bg-success bg-opacity-10 border border-success border-opacity-30 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-success font-medium text-sm">Import complete</p>
              <p className="text-text-secondary text-sm mt-1">
                Imported {summary.clubs} club{summary.clubs === 1 ? '' : 's'} and{' '}
                {summary.shots} shot{summary.shots === 1 ? '' : 's'}.
              </p>
              <div className="flex gap-3 mt-3">
                <Link href="/clubs">
                  <Button variant="outline" size="sm">View Clubs</Button>
                </Link>
                <Link href="/shots">
                  <Button variant="outline" size="sm">View Shots</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <Card variant="default" padding="lg">
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary">
              Clubs &amp; Shots Template
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary mb-4">
              The template includes your current clubs and shots (if any). Importing
              replaces your existing clubs and shots with the contents of the uploaded
              file.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" size="md" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Importing…' : 'Upload & Import'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
