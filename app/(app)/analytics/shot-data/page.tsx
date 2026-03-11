/**
 * Shot-to-Shot Analytics Page
 *
 * Displays AI compliance stats, club carry accuracy, and round-over-round
 * trends derived from the inference engine.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { getClubAnalytics, getRoundSummaries } from '@/lib/api/shotAnalyticsService';
import type { ClubAnalytics, RoundSummary } from '@/types/shotAnalytics';
import { ChevronLeft, Target, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

function pct(n: number, decimals = 0) {
  return `${(n * 100).toFixed(decimals)}%`;
}

function signed(n: number, decimals = 1) {
  const s = n.toFixed(decimals);
  return n > 0 ? `+${s}` : s;
}

export default function ShotDataPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [clubStats, setClubStats] = useState<ClubAnalytics[]>([]);
  const [roundSummaries, setRoundSummaries] = useState<RoundSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const [clubs, rounds] = await Promise.all([
          getClubAnalytics(user.uid),
          getRoundSummaries(user.uid, 20),
        ]);
        setClubStats(clubs);
        setRoundSummaries(rounds);
      } catch (err) {
        setError('Failed to load shot analytics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ── Aggregate compliance across all rounds ──────────────────────────────────
  const totalTracked = roundSummaries.reduce((a, r) => a + r.totalTrackedShots, 0);
  const totalFollowed = roundSummaries.reduce(
    (a, r) => a + r.followedPrimaryCount + r.followedSecondaryCount,
    0
  );
  const overallCompliance = totalTracked > 0 ? totalFollowed / totalTracked : null;

  const scoreFollowed =
    roundSummaries.filter((r) => r.followedPrimaryCount > 0).length > 0
      ? roundSummaries
          .filter((r) => r.followedPrimaryCount > 0)
          .reduce((a, r) => a + r.scoreWhenFollowedAI, 0) /
        roundSummaries.filter((r) => r.followedPrimaryCount > 0).length
      : null;

  const scoreOverrode =
    roundSummaries.filter((r) => r.overrodeCount > 0).length > 0
      ? roundSummaries
          .filter((r) => r.overrodeCount > 0)
          .reduce((a, r) => a + r.scoreWhenOverrodeAI, 0) /
        roundSummaries.filter((r) => r.overrodeCount > 0).length
      : null;

  if (authLoading || (loading && !error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const noData = !loading && clubStats.length === 0 && roundSummaries.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/analytics" className="text-foreground-secondary hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shot-to-Shot Analytics</h1>
          <p className="text-sm text-foreground-secondary mt-0.5">
            Carry accuracy, AI compliance, and score impact
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {noData && (
        <Card variant="default" padding="lg">
          <CardContent>
            <div className="text-center py-12 space-y-3">
              <Activity className="w-10 h-10 text-foreground-muted mx-auto" />
              <p className="text-foreground-secondary font-medium">No shot data yet</p>
              <p className="text-sm text-foreground-muted max-w-sm mx-auto">
                Shot-by-shot analytics are captured automatically during play. Complete a round
                with the Copperline Golf mobile app to see your data here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── AI Compliance Summary ─────────────────────────────────────────── */}
      {(overallCompliance !== null || scoreFollowed !== null) && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            AI Compliance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {overallCompliance !== null && (
              <Card variant="elevated" padding="md">
                <CardContent>
                  <p className="text-xs text-foreground-secondary uppercase tracking-wide mb-1">
                    Follow Rate
                  </p>
                  <p className="text-3xl font-bold text-primary">{pct(overallCompliance)}</p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {totalFollowed} / {totalTracked} tracked shots
                  </p>
                </CardContent>
              </Card>
            )}
            {scoreFollowed !== null && (
              <Card variant="elevated" padding="md">
                <CardContent>
                  <p className="text-xs text-foreground-secondary uppercase tracking-wide mb-1">
                    Score When Following AI
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      scoreFollowed <= 0 ? 'text-success' : 'text-error'
                    }`}
                  >
                    {signed(scoreFollowed)} / hole
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">avg vs par</p>
                </CardContent>
              </Card>
            )}
            {scoreOverrode !== null && (
              <Card variant="elevated" padding="md">
                <CardContent>
                  <p className="text-xs text-foreground-secondary uppercase tracking-wide mb-1">
                    Score When Overriding AI
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      scoreOverrode <= 0 ? 'text-success' : 'text-error'
                    }`}
                  >
                    {signed(scoreOverrode)} / hole
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">avg vs par</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ── Club Carry Analytics ──────────────────────────────────────────── */}
      {clubStats.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Club Carry Accuracy
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary text-foreground-secondary">
                  <th className="text-left px-4 py-3 font-medium">Club</th>
                  <th className="text-right px-4 py-3 font-medium">Avg Carry</th>
                  <th className="text-right px-4 py-3 font-medium">vs Predicted</th>
                  <th className="text-right px-4 py-3 font-medium">Consistency</th>
                  <th className="text-right px-4 py-3 font-medium">GIR Rate</th>
                  <th className="text-right px-4 py-3 font-medium">Shots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clubStats.map((club) => (
                  <tr key={club.docId} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{club.clubName}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {club.averageCarryYards > 0 ? `${club.averageCarryYards.toFixed(0)}y` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {club.averageCarryDeltaYards !== 0 ? (
                        <span
                          className={`font-medium ${
                            club.averageCarryDeltaYards >= 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {signed(club.averageCarryDeltaYards, 0)}y
                        </span>
                      ) : (
                        <span className="text-foreground-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground-secondary">
                      {club.carryStdDevYards > 0 ? `±${club.carryStdDevYards.toFixed(0)}y` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground-secondary">
                      {club.greenHitRate > 0 ? pct(club.greenHitRate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground-muted">{club.totalShots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-foreground-muted">
            "vs Predicted" = your actual carry minus the AI&apos;s predicted carry. Negative means
            you&apos;re hitting shorter than expected.
          </p>
        </section>
      )}

      {/* ── Recent Rounds ─────────────────────────────────────────────────── */}
      {roundSummaries.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Round Summaries
          </h2>
          <div className="space-y-3">
            {roundSummaries.map((round) => (
              <Card key={round.roundId} variant="default" padding="md">
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {round.courseName ?? 'Unknown Course'}
                      </p>
                      <p className="text-xs text-foreground-muted mt-0.5">{round.date}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm shrink-0">
                      {/* Score */}
                      <div className="text-right">
                        <p className="text-xs text-foreground-secondary">Score</p>
                        <p
                          className={`font-semibold ${
                            round.scoreRelativeToPar <= 0 ? 'text-success' : 'text-foreground'
                          }`}
                        >
                          {signed(round.scoreRelativeToPar, 0)}
                        </p>
                      </div>
                      {/* Compliance */}
                      <div className="text-right">
                        <p className="text-xs text-foreground-secondary">AI Follow</p>
                        <p className="font-semibold text-primary">
                          {pct(round.overallComplianceRate)}
                        </p>
                      </div>
                      {/* GIR */}
                      <div className="text-right">
                        <p className="text-xs text-foreground-secondary">GIR</p>
                        <p className="font-semibold text-foreground">
                          {round.greensInRegulation}/{round.holesPlayed}
                        </p>
                      </div>
                      {/* Putts */}
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-foreground-secondary">Putts</p>
                        <p className="font-semibold text-foreground">{round.totalPutts}</p>
                      </div>
                    </div>
                  </div>

                  {/* Score impact bar */}
                  {round.totalTrackedShots > 0 && (
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs text-foreground-secondary">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                        <span>
                          Following AI:{' '}
                          <span
                            className={
                              round.scoreWhenFollowedAI <= 0 ? 'text-success font-medium' : 'text-error font-medium'
                            }
                          >
                            {signed(round.scoreWhenFollowedAI)} / hole
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-error" />
                        <span>
                          Overriding AI:{' '}
                          <span
                            className={
                              round.scoreWhenOverrodeAI <= 0 ? 'text-success font-medium' : 'text-error font-medium'
                            }
                          >
                            {signed(round.scoreWhenOverrodeAI)} / hole
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
