'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import {
  getShotEventPoints,
  type ShotEventGeoPoint,
  type ShotEventType,
} from '@/lib/api/shotEventGeo';

const ShotEventMap = dynamic(() => import('@/components/analytics/ShotEventMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-text-secondary">
      Loading map…
    </div>
  ),
});

const FILTERS: Array<{ value: ShotEventType | 'all'; label: string; color: string }> = [
  { value: 'all',             label: 'All',             color: '#6b7280' },
  { value: 'optimizer_run',   label: 'Optimizer',       color: '#22c55e' },
  { value: 'ai_conversation', label: 'AI conversation', color: '#3b82f6' },
  { value: 'ellipse_target',  label: 'Target',          color: '#f97316' },
];

export default function ShotMapPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [points, setPoints] = useState<ShotEventGeoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ShotEventType | 'all'>('all');
  const [agentFilter, setAgentFilter] = useState<'kept-only' | 'all' | 'dropped-only'>('kept-only');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const pts = await getShotEventPoints({
          userId: user.uid,
          eventType: filter === 'all' ? undefined : filter,
          agentFilter,
          max: 1000,
        });
        if (!cancelled) setPoints(pts);
      } catch (err) {
        console.error('[ShotMap] load failed:', err);
        if (!cancelled) setPoints([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, filter, agentFilter]);

  const counts = useMemo(() => {
    return points.reduce<Record<string, number>>((acc, p) => {
      acc[p.eventType] = (acc[p.eventType] ?? 0) + 1;
      return acc;
    }, {});
  }, [points]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Shot Event Map</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              {(['kept-only', 'all', 'dropped-only'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setAgentFilter(v)}
                  className={`px-2.5 py-1 ${
                    agentFilter === v
                      ? 'bg-primary text-white'
                      : 'bg-card text-text-primary hover:bg-primary/10'
                  }`}
                  title={
                    v === 'kept-only'
                      ? 'Show only calls the agent kept as real shots'
                      : v === 'all'
                      ? 'Show every call, including ones the agent discarded'
                      : 'Show only the calls the agent discarded as exploratory'
                  }
                >
                  {v === 'kept-only' ? 'Kept' : v === 'all' ? 'All' : 'Dropped'}
                </button>
              ))}
            </div>
            <span className="text-sm text-text-secondary">
              {loading ? 'Loading…' : `${points.length} points`}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full px-4 py-4 flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const active = filter === f.value;
          const n = f.value === 'all' ? points.length : counts[f.value] ?? 0;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-text-primary border-border hover:border-primary'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                style={{ background: f.color }}
              />
              {f.label}
              {filter !== f.value && f.value !== 'all' && (
                <span className="ml-2 text-text-secondary">{n}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 pb-2 text-xs text-text-secondary flex flex-wrap gap-x-4 gap-y-1">
        <span><span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: '#a78bfa' }} /> predicted landing (dashed)</span>
        <span><span className="inline-block w-3 h-px mr-1 align-middle" style={{ background: '#22c55e' }} /> actual landing (solid)</span>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 pb-4">
        <div className="h-[70vh] rounded-xl overflow-hidden border border-border">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center text-text-secondary">
              Loading events…
            </div>
          ) : points.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-text-secondary text-center px-6">
              No GPS-tagged events yet. Use the optimizer or AI agent on the course
              and they'll show up here.
            </div>
          ) : (
            <ShotEventMap points={points} />
          )}
        </div>
      </div>
    </div>
  );
}
