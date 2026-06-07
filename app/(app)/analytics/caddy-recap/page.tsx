'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Compass, Flag, MapPin, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { loadCaddySessions, type CaddySession, type CaddyMoment } from '@/lib/api/caddySessions';

/**
 * Caddy Recap — value from sparse data.
 *
 * Shows what the caddy did for the user on-course (distances measured, clubs
 * recommended) even when the round was never scored or finalized. Each tier
 * of data unlocks more; the page teases the next tier to pull users up the
 * engagement ladder: optimizer asks → scorecard → finished rounds.
 */
export default function CaddyRecapPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<CaddySession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadCaddySessions(user.uid)
      .then(s => { if (!cancelled) setSessions(s); })
      .catch(err => {
        console.warn('[caddy-recap] load failed:', err);
        if (!cancelled) setError('Could not load your caddy sessions.');
      });
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || (user && sessions === null && !error)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Caddy Recap</h1>
          <span className="text-xs text-text-secondary">
            What your caddy saw — even on rounds you didn&apos;t finish
          </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg p-3">
            {error}
          </div>
        )}

        {sessions !== null && sessions.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-primary" />
            <h2 className="font-semibold">No caddy moments yet</h2>
            <p className="text-sm text-text-secondary">
              Next time you&apos;re on the course, tap the optimizer on any shot —
              we&apos;ll do the math and show you everything we measured right here.
            </p>
          </div>
        )}

        {sessions?.map(session => (
          <SessionCard key={`${session.date}-${session.courseId ?? 'unknown'}`} session={session} />
        ))}
      </div>
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: CaddySession }) {
  const durationMin = Math.round((session.endTime - session.startTime) / 60000);

  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-background border-b border-border flex items-center gap-3 flex-wrap">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <div className="font-semibold">
          {session.courseName ?? 'On the course'}
        </div>
        <div className="text-xs text-text-secondary">
          {session.date}
          {durationMin > 0 && ` · ${formatDuration(durationMin)}`}
        </div>
        <div className="ml-auto text-xs text-text-secondary">
          Your caddy ran the numbers{' '}
          <strong className="text-text-primary">{session.totalAsks}×</strong> across{' '}
          <strong className="text-text-primary">{session.holesEngaged.length}</strong>{' '}
          hole{session.holesEngaged.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Moment cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {dedupeForDisplay(session.moments).map((m, i) => (
          <MomentCard key={i} moment={m} />
        ))}
      </div>

      {/* Ladder tease */}
      {!session.hasScorecard && (
        <div className="px-4 pb-4">
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">This is just a glimpse.</span>{' '}
              <span className="text-text-secondary">
                Log your scores next round and we&apos;ll show how each decision played
                out — dispersion, club performance, and your full round summary.
              </span>{' '}
              <Link href="/scores" className="text-primary hover:underline font-medium">
                Try the scorecard →
              </Link>
            </div>
          </div>
        </div>
      )}
      {session.hasScorecard && (
        <div className="px-4 pb-4 text-xs text-text-secondary">
          You also scored a round this day —{' '}
          <Link href="/analytics/round-summary" className="text-primary hover:underline">
            see the full round summary
          </Link>.
        </div>
      )}
    </section>
  );
}

// ─── Moment card ──────────────────────────────────────────────────────────────

function MomentCard({ moment: m }: { moment: CaddyMoment & { askCount?: number } }) {
  const time = new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const holeLabel = m.par
    ? `Hole ${m.holeNumber} · Par ${m.par}${m.holeYards ? ` · ${m.holeYards}y` : ''}`
    : `Hole ${m.holeNumber}`;

  if (m.detail === 'click') {
    return (
      <div className="border border-border rounded-lg p-3 flex items-center gap-3">
        <Compass className="w-4 h-4 text-text-secondary shrink-0" />
        <div className="text-sm">
          <div className="font-medium">{holeLabel}</div>
          <div className="text-xs text-text-secondary">
            {time} — you asked your caddy
            {m.askCount && m.askCount > 1 ? ` ${m.askCount} times` : ''} here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-primary shrink-0" />
        <div className="text-sm font-medium">{holeLabel}</div>
        {m.askCount && m.askCount > 1 && (
          <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
            asked {m.askCount}×
          </span>
        )}
        <div className="ml-auto text-xs text-text-secondary">{time}</div>
      </div>

      {m.distanceToGreen !== undefined && (
        <div className="text-sm text-text-secondary">
          We measured{' '}
          <strong className="text-text-primary">{m.distanceToGreen}y to the green</strong>
          {m.fromTee ? ' from the tee' : ''}
          {m.targetType === 'centerline'
            ? ' and read the landing zones'
            : m.targetType === 'pin'
            ? ' and lined you up at the pin'
            : ''}
          .
        </div>
      )}

      {m.primaryClub && (
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>{m.primaryClub}</strong>
            {m.primaryCarryYards ? ` — ${m.primaryCarryYards}y carry` : ''}
            {m.secondaryClub && (
              <span className="text-text-secondary">
                {' '}(backup: {m.secondaryClub}
                {m.secondaryCarryYards ? ` ${m.secondaryCarryYards}y` : ''})
              </span>
            )}
          </span>
        </div>
      )}

      <div className="text-xs text-text-secondary italic">
        That&apos;s the math you didn&apos;t have to do.
      </div>
    </div>
  );
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/**
 * Collapse repeats into one card with a count ("you asked 5 times here"):
 *  - click-only asks merge per hole
 *  - full moments merge when the immediately preceding kept card is the same
 *    hole + same recommendation (the mobile client sometimes double-writes);
 *    a CHANGED recommendation on the same hole still gets its own card —
 *    that's the caddy re-reading the shot as the player moves.
 */
function dedupeForDisplay(
  moments: CaddyMoment[]
): Array<CaddyMoment & { askCount?: number }> {
  const out: Array<CaddyMoment & { askCount?: number }> = [];
  const clickIdxByHole = new Map<number, number>();
  for (const m of moments) {
    if (m.detail === 'full') {
      const prev = out[out.length - 1];
      if (
        prev &&
        prev.detail === 'full' &&
        prev.holeNumber === m.holeNumber &&
        prev.primaryClub === m.primaryClub &&
        prev.primaryCarryYards === m.primaryCarryYards
      ) {
        prev.askCount = (prev.askCount ?? 1) + 1;
      } else {
        out.push({ ...m, askCount: 1 });
      }
      continue;
    }
    const existing = clickIdxByHole.get(m.holeNumber);
    if (existing !== undefined) {
      out[existing].askCount = (out[existing].askCount ?? 1) + 1;
    } else {
      clickIdxByHole.set(m.holeNumber, out.length);
      out.push({ ...m, askCount: 1 });
    }
  }
  return out;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min on course`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m on course`;
}
