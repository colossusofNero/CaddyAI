/**
 * Round History Detail Page
 * Displays full scorecard and stats for a single round.
 * Fetches from `scores` (mobile) then `rounds` (web) collection.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Flag,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLabels } from '@/hooks/useLabels';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import roundsApi from '@/lib/api/rounds';
import { getScoreName, getScoreColor } from '@/lib/scoreUtils';
import type { Round } from '@/lib/api/types';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getScoreBgClass(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return 'bg-yellow-500 bg-opacity-20 border-yellow-500 text-yellow-400';
  if (diff === -1) return 'bg-green-500 bg-opacity-20 border-green-500 text-green-400';
  if (diff === 0) return 'bg-gray-600 border-gray-500 text-gray-200';
  if (diff === 1) return 'bg-orange-500 bg-opacity-20 border-orange-500 text-orange-400';
  return 'bg-red-500 bg-opacity-20 border-red-500 text-red-400';
}

export default function RoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { labels } = useLabels();

  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const roundId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !roundId) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await roundsApi.getRoundById(roundId);
        if (!data) {
          setNotFound(true);
        } else {
          setRound(data);
        }
      } catch (err: any) {
        console.error('[RoundDetail] Error loading round:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, roundId]);

  // --- Loading skeleton ---
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4" />
          <p className="text-text-secondary text-lg">Loading round...</p>
        </div>
      </div>
    );
  }

  // --- Not found state ---
  if (notFound || !round) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-secondary-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/history">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to History
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-20 h-20 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Flag className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Round Not Found</h2>
          <p className="text-text-secondary mb-6">
            This round doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link href="/history">
            <Button>Back to History</Button>
          </Link>
        </main>
      </div>
    );
  }

  // --- Compute stats ---
  const totalPar = round.holes.reduce((sum, h) => sum + h.par, 0);
  const parDiff = round.score - totalPar;

  let fairwaysHit = 0;
  let fairwaysTotal = 0;
  let greensHit = 0;
  let greensTotal = 0;
  let totalPutts = 0;
  let birdiesOrBetter = 0;
  let pars = 0;
  let bogeys = 0;
  let doubleBogeys = 0;

  for (const hole of round.holes) {
    if (hole.fairwayHit !== undefined) {
      if (hole.fairwayHit) fairwaysHit++;
      fairwaysTotal++;
    }
    if (hole.greenInRegulation !== undefined) {
      if (hole.greenInRegulation) greensHit++;
      greensTotal++;
    }
    if (hole.putts) {
      totalPutts += hole.putts;
    }
    if (hole.score && hole.par) {
      const diff = hole.score - hole.par;
      if (diff <= -1) birdiesOrBetter++;
      else if (diff === 0) pars++;
      else if (diff === 1) bogeys++;
      else doubleBogeys++;
    }
  }

  const avgPutts = round.holes.length > 0 ? (totalPutts / round.holes.length).toFixed(1) : '0.0';

  // Front 9 / Back 9 split
  const front9 = round.holes.filter(h => h.holeNumber <= 9);
  const back9 = round.holes.filter(h => h.holeNumber > 9);
  const front9Score = front9.reduce((s, h) => s + (h.score || 0), 0);
  const back9Score = back9.reduce((s, h) => s + (h.score || 0), 0);

  // Round type label
  const holesCount = round.holes.length;
  let roundTypeLabel = `${holesCount} ${holesCount === 1 ? 'Hole' : 'Holes'}`;
  if (holesCount === 18) roundTypeLabel = labels.roundTypes['18'];
  else if (holesCount === 9) {
    const firstHole = round.holes[0]?.holeNumber;
    if (firstHole && firstHole > 9) roundTypeLabel = labels.roundTypes['9-back'];
    else roundTypeLabel = labels.roundTypes['9-front'];
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-secondary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/history">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to History
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Title card */}
        <Card variant="elevated" padding="lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <h1 className="text-2xl font-bold text-text-primary">{round.courseName}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(round.date)}
                </div>
                <span className="px-2 py-0.5 bg-primary bg-opacity-20 text-primary rounded-full text-xs font-medium">
                  {roundTypeLabel}
                </span>
                {round.teeUsed && (
                  <span className="flex items-center gap-1.5">
                    {round.teeColor && (
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-white border-opacity-20 flex-shrink-0"
                        style={{ backgroundColor: round.teeColor }}
                      />
                    )}
                    <span>{round.teeUsed} Tees</span>
                  </span>
                )}
              </div>
            </div>

            {/* Final score */}
            <div className="text-center sm:text-right">
              <p className="text-text-secondary text-xs mb-1">{labels.scorecard.score}</p>
              <p
                className="text-4xl font-bold"
                style={{ color: getScoreColor(round.score, totalPar) }}
              >
                {round.score}
              </p>
              <p className="text-text-secondary text-sm mt-1">
                Par {totalPar} ({parDiff > 0 ? '+' : ''}{parDiff})
              </p>
            </div>
          </div>
        </Card>

        {/* Scorecard */}
        <Card variant="elevated" padding="none">
          <div className="p-4 border-b border-secondary-700">
            <h2 className="text-lg font-semibold text-text-primary">Scorecard</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-700 bg-secondary-800">
                  <th className="text-left px-4 py-3 text-text-secondary font-medium w-12">
                    {labels.scorecard.hole}
                  </th>
                  <th className="text-center px-3 py-3 text-text-secondary font-medium">
                    {labels.scorecard.par}
                  </th>
                  <th className="text-center px-3 py-3 text-text-secondary font-medium">
                    {labels.scorecard.score}
                  </th>
                  <th className="text-center px-3 py-3 text-text-secondary font-medium">
                    {labels.scorecard.putts}
                  </th>
                  <th className="text-center px-3 py-3 text-text-secondary font-medium">
                    {labels.scorecard.fir}
                  </th>
                  <th className="text-center px-3 py-3 text-text-secondary font-medium">
                    {labels.scorecard.gir}
                  </th>
                </tr>
              </thead>
              <tbody>
                {round.holes.map((hole) => (
                  <tr key={hole.holeNumber} className="border-b border-secondary-700 last:border-0 hover:bg-secondary-800 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{hole.holeNumber}</td>
                    <td className="px-3 py-3 text-center text-text-secondary">{hole.par}</td>
                    <td className="px-3 py-3 text-center">
                      {hole.score ? (
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold border text-sm ${getScoreBgClass(hole.score, hole.par)}`}
                          title={getScoreName(hole.score, hole.par, labels)}
                        >
                          {hole.score}
                        </span>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-text-primary">{hole.putts ?? '-'}</td>
                    <td className="px-3 py-3 text-center">
                      {hole.fairwayHit !== undefined ? (
                        <span className={hole.fairwayHit ? 'text-success' : 'text-error'}>
                          {hole.fairwayHit ? '✓' : '✗'}
                        </span>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {hole.greenInRegulation !== undefined ? (
                        <span className={hole.greenInRegulation ? 'text-success' : 'text-error'}>
                          {hole.greenInRegulation ? '✓' : '✗'}
                        </span>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Front 9 / Back 9 totals for 18-hole rounds */}
                {holesCount === 18 && (
                  <>
                    <tr className="border-t-2 border-secondary-600 bg-secondary-800">
                      <td className="px-4 py-2 font-semibold text-text-secondary text-xs uppercase tracking-wide" colSpan={2}>
                        {labels.scorecard.out}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-text-primary">{front9Score}</td>
                      <td className="px-3 py-2 text-center text-text-secondary">
                        {front9.reduce((s, h) => s + (h.putts || 0), 0) || '-'}
                      </td>
                      <td colSpan={2} />
                    </tr>
                    <tr className="border-b border-secondary-600 bg-secondary-800">
                      <td className="px-4 py-2 font-semibold text-text-secondary text-xs uppercase tracking-wide" colSpan={2}>
                        {labels.scorecard.in}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-text-primary">{back9Score}</td>
                      <td className="px-3 py-2 text-center text-text-secondary">
                        {back9.reduce((s, h) => s + (h.putts || 0), 0) || '-'}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </>
                )}

                {/* Total row */}
                <tr className="bg-secondary-700">
                  <td className="px-4 py-3 font-bold text-text-primary uppercase text-xs tracking-wide" colSpan={2}>
                    {labels.scorecard.total}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-text-primary text-base">{round.score}</td>
                  <td className="px-3 py-3 text-center font-semibold text-text-primary">{totalPutts || '-'}</td>
                  <td className="px-3 py-3 text-center text-text-secondary text-xs">
                    {fairwaysTotal > 0 ? `${fairwaysHit}/${fairwaysTotal}` : '-'}
                  </td>
                  <td className="px-3 py-3 text-center text-text-secondary text-xs">
                    {greensTotal > 0 ? `${greensHit}/${greensTotal}` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Performance stats */}
          <Card variant="elevated" padding="lg">
            <h3 className="text-base font-semibold text-text-primary mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{labels.stats.fairwaysHit}</span>
                <span className="text-text-primary font-medium text-sm">
                  {fairwaysTotal > 0 ? `${fairwaysHit}/${fairwaysTotal} (${Math.round((fairwaysHit / fairwaysTotal) * 100)}%)` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{labels.stats.greensInRegulation}</span>
                <span className="text-text-primary font-medium text-sm">
                  {greensTotal > 0 ? `${greensHit}/${greensTotal} (${Math.round((greensHit / greensTotal) * 100)}%)` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{labels.stats.totalPutts}</span>
                <span className="text-text-primary font-medium text-sm">{totalPutts || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{labels.stats.averagePuttsPerHole}</span>
                <span className="text-text-primary font-medium text-sm">{totalPutts > 0 ? avgPutts : '-'}</span>
              </div>
            </div>
          </Card>

          {/* Score breakdown */}
          <Card variant="elevated" padding="lg">
            <h3 className="text-base font-semibold text-text-primary mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{labels.scoring.birdiesOrBetter}</span>
                <span className="text-success font-medium">{birdiesOrBetter}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{labels.scoring.pars}</span>
                <span className="text-primary font-medium">{pars}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{labels.scoring.bogeys}</span>
                <span className="text-warning font-medium">{bogeys}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{labels.scoring.doubles}</span>
                <span className="text-error font-medium">{doubleBogeys}</span>
              </div>
            </div>
          </Card>
        </div>

      </main>
    </div>
  );
}
