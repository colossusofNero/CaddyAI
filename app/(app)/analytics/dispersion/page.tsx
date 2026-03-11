'use client';

/**
 * Shot Dispersion Page
 *
 * Shows where approach shots land relative to the pin — the
 * "Golf Stats for Dummies" fairway + green diagram, powered by
 * recommendation event outcome data.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { ShotDispersionChart, type ShotDot } from '@/components/analytics/ShotDispersionChart';
import { recommendationTrackingService } from '@/services/recommendationTrackingService';
import type { RecommendationEvent } from '@/types/recommendationTracking';
import { ChevronLeft, Target, Info } from 'lucide-react';

// ── Map a recommendation event to a ShotDot ───────────────────────────────────

function eventToShot(event: RecommendationEvent): ShotDot | null {
  const outcome = event.outcome;
  if (!outcome) return null;

  // Distance to pin after the shot
  const distanceToPin = outcome.distanceToTarget ?? 0;
  const landedOnGreen = outcome.landingArea === 'green';

  // Compliance
  const dt = event.userDecision?.decisionType;
  const compliance: ShotDot['compliance'] =
    dt === 'followed-primary' || dt === 'followed-secondary' ? 'followed' :
    dt === 'chose-different' ? 'overrode' : 'unknown';

  // Deterministic lateral scatter (0–1) derived from event id so it's stable on re-renders
  const idHash = event.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const lateralPosition = 0.15 + (idHash % 70) / 100; // keeps dots in the 15–85% range

  const club = event.userDecision?.chosenClubName ?? event.recommendations?.[0]?.clubName;

  return {
    holeNumber: event.holeNumber ?? 0,
    distanceToPin,
    landedOnGreen,
    lateralPosition,
    compliance,
    club,
    source: event.source,
    label: `Hole ${event.holeNumber} — ${club ?? 'Unknown club'} — ${distanceToPin}y from pin`,
  };
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

function pct(n: number, d: number) {
  return d === 0 ? '—' : `${Math.round((n / d) * 100)}%`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ShotDispersionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState<RecommendationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const all = await recommendationTrackingService.getRecommendations({
          userId: user.uid,
          limit: 200,
        });
        setEvents(all);
      } catch (err) {
        console.error(err);
        setError('Failed to load shot data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Filter by time range
  const now = Date.now();
  const toMs = (ts: any): number => {
    if (!ts) return 0;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts === 'number') return ts;
    if (ts._seconds) return ts._seconds * 1000;
    return new Date(ts).getTime() || 0;
  };

  const filtered = events.filter((e) => {
    const ms = toMs(e.timestamp);
    if (range === 'week') return now - ms < 7 * 24 * 3600 * 1000;
    if (range === 'month') return now - ms < 30 * 24 * 3600 * 1000;
    return true;
  });

  // Only approach shots with outcome data (filter out no-outcome events)
  const approachEvents = filtered.filter(
    (e) => e.outcome && e.holeNumber !== undefined && e.holeNumber > 0
  );

  const shots: ShotDot[] = approachEvents
    .map(eventToShot)
    .filter((s): s is ShotDot => s !== null);

  // Summary stats
  const onGreen = shots.filter((s) => s.landedOnGreen).length;
  const within25 = shots.filter((s) => !s.landedOnGreen && s.distanceToPin <= 25).length;
  const within50 = shots.filter((s) => !s.landedOnGreen && s.distanceToPin <= 50).length;
  const followed = shots.filter((s) => s.compliance === 'followed').length;

  if (authLoading || (loading && !error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/analytics" className="text-foreground-secondary hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Shot Dispersion
          </h1>
          <p className="text-sm text-foreground-secondary mt-0.5">
            Where your approach shots land relative to the pin
          </p>
        </div>
      </div>

      {/* Time range */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              range === r
                ? 'bg-primary text-white border-primary'
                : 'bg-transparent text-foreground-secondary border-border hover:border-primary hover:text-primary'
            }`}
          >
            {r === 'week' ? 'Last 7 Days' : r === 'month' ? 'Last 30 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {shots.length === 0 && !loading ? (
        <Card variant="default" padding="lg">
          <CardContent>
            <div className="text-center py-12 space-y-3">
              <Target className="w-10 h-10 text-foreground-muted mx-auto" />
              <p className="text-foreground-secondary font-medium">No approach shot data yet</p>
              <p className="text-sm text-foreground-muted max-w-xs mx-auto">
                Approach shot outcomes are recorded automatically during rounds using the
                Copperline Golf mobile app.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats row */}
          <div className="grid grid-cols-4 gap-3">
            <Card variant="elevated" padding="sm">
              <CardContent>
                <p className="text-xs text-foreground-secondary">Shots</p>
                <p className="text-2xl font-bold text-foreground">{shots.length}</p>
              </CardContent>
            </Card>
            <Card variant="elevated" padding="sm">
              <CardContent>
                <p className="text-xs text-foreground-secondary">GIR</p>
                <p className="text-2xl font-bold text-primary">{pct(onGreen, shots.length)}</p>
              </CardContent>
            </Card>
            <Card variant="elevated" padding="sm">
              <CardContent>
                <p className="text-xs text-foreground-secondary">Within 50y</p>
                <p className="text-2xl font-bold text-foreground">{pct(onGreen + within50, shots.length)}</p>
              </CardContent>
            </Card>
            <Card variant="elevated" padding="sm">
              <CardContent>
                <p className="text-xs text-foreground-secondary">AI Follow</p>
                <p className="text-2xl font-bold text-foreground">{pct(followed, shots.length)}</p>
              </CardContent>
            </Card>
          </div>

          {/* The diagram */}
          <Card variant="elevated" padding="lg">
            <CardContent>
              <div className="flex items-center justify-center">
                <ShotDispersionChart shots={shots} maxYards={225} />
              </div>
            </CardContent>
          </Card>

          {/* Insight callout */}
          {shots.length >= 3 && (
            <div className="flex gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-foreground-secondary">
                {onGreen > shots.length / 2
                  ? `Great iron play — ${pct(onGreen, shots.length)} of your approaches found the green.`
                  : within50 + onGreen > shots.length / 2
                  ? `${pct(onGreen + within50, shots.length)} of your approaches finished within 50y of the pin, giving you makeable chips.`
                  : `Most of your approaches are finishing ${Math.round(shots.reduce((a,s)=>a+s.distanceToPin,0)/shots.length)}y from the pin on average — focus on getting inside 50y.`
                }
                {followed > shots.length * 0.7 && ' You\'re following the AI recommendation on most shots.'}
              </p>
            </div>
          )}

          {/* Shot list */}
          <Card variant="default" padding="md">
            <CardContent>
              <p className="text-sm font-semibold text-foreground mb-3">Shot Log</p>
              <div className="space-y-2">
                {shots.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: s.compliance === 'followed' ? '#b87333' : s.compliance === 'overrode' ? '#ef4444' : '#6b7280' }}
                    >
                      {s.holeNumber}
                    </span>
                    <span className="text-foreground-secondary flex-1">{s.club ?? '—'}</span>
                    <span className={`font-medium ${s.landedOnGreen ? 'text-success' : 'text-foreground'}`}>
                      {s.landedOnGreen ? 'GIR ✓' : `${Math.round(s.distanceToPin)}y out`}
                    </span>
                    <span className={`text-xs ${s.compliance === 'followed' ? 'text-primary' : s.compliance === 'overrode' ? 'text-error' : 'text-foreground-muted'}`}>
                      {s.compliance === 'followed' ? 'AI ✓' : s.compliance === 'overrode' ? 'Override' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
