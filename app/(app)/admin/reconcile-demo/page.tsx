'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/hooks/useAuth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';

interface DemoDecision {
  eventId: string;
  kept: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  ruleId: string;
  gps: { latitude: number; longitude: number } | null;
  timestampOffsetSec: number;
  lie?: string | null;
  clubConsidered: string | null;
}

interface SimpleDemoResponse {
  scenario: 'simple';
  summary: {
    eventsConsidered: number;
    expectedKept: number;
    actualKept: number;
    needsLlmJudge: boolean;
  };
  decisions: DemoDecision[];
}

interface AmbiguousDemoResponse {
  scenario: 'ambiguous';
  summary: {
    eventsConsidered: number;
    expectedKept: number;
    rulesEngineKept: number;
    finalKept: number;
    llmJudgeInvoked: boolean;
    llmJudgeAvailable: boolean;
  };
  rulesEngineDecisions: Array<{
    eventId: string;
    kept: boolean;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
    ruleId: string;
  }>;
  finalDecisions: DemoDecision[];
}

type DemoResponse = SimpleDemoResponse | AmbiguousDemoResponse;

export default function ReconcileDemoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<DemoResponse | null>(null);
  const [running, setRunning] = useState<'simple' | 'ambiguous' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const runDemo = async (scenario: 'simple' | 'ambiguous') => {
    if (!app) {
      setError('Firebase app not initialized');
      return;
    }
    setRunning(scenario);
    setError(null);
    setResult(null);
    try {
      const name = scenario === 'simple' ? 'reconcileHoleDemo' : 'reconcileHoleAmbiguousDemo';
      const fn = httpsCallable<unknown, Omit<DemoResponse, 'scenario'>>(getFunctions(app), name);
      const { data } = await fn();
      setResult({ ...data, scenario } as DemoResponse);
    } catch (err) {
      console.error('[ReconcileDemo] error:', err);
      setError(err instanceof Error ? err.message : 'Failed to invoke function');
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Hole Reconcile — Demo</h1>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <ScenarioCard
            title="Simple — rules engine handles it"
            description="9 calls (3 white-tee, 1 red-tee, 3 fairway, 1 rough, 1 off-green). Par-4 with FIR yes, GIR no, 1 putt. Rules 1–5 resolve cleanly; no LLM needed."
            buttonLabel="Run simple demo"
            onClick={() => runDemo('simple')}
            running={running === 'simple'}
          />
          <ScenarioCard
            title="Ambiguous — escalates to LLM judge"
            description="6 calls (2 tee 12yd apart, 2 fairway 15yd apart, 2 cluster-mates). Par-4 with FIR yes, GIR yes, 2 putts. Rules engine keeps 4; expected 2. Judge picks the committed call in each phase."
            buttonLabel="Run ambiguous demo"
            onClick={() => runDemo('ambiguous')}
            running={running === 'ambiguous'}
            accent
          />
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {result?.scenario === 'simple' && <SimpleResult result={result} />}
        {result?.scenario === 'ambiguous' && <AmbiguousResult result={result} />}
      </div>
    </div>
  );
}

function ScenarioCard({
  title,
  description,
  buttonLabel,
  onClick,
  running,
  accent,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  running: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <h2 className="font-semibold mb-2">{title}</h2>
      <p className="text-sm text-text-secondary mb-4">{description}</p>
      <Button onClick={onClick} disabled={running} variant="primary" className="gap-2">
        <Play className="w-4 h-4" />
        {running ? 'Running…' : buttonLabel}
      </Button>
    </div>
  );
}

function SimpleResult({ result }: { result: SimpleDemoResponse }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryStat label="Events" value={result.summary.eventsConsidered} />
        <SummaryStat label="Expected kept" value={result.summary.expectedKept} />
        <SummaryStat
          label="Actual kept"
          value={result.summary.actualKept}
          tone={result.summary.actualKept === result.summary.expectedKept ? 'good' : 'warn'}
        />
        <SummaryStat
          label="LLM judge?"
          value={result.summary.needsLlmJudge ? 'yes' : 'no'}
          tone={result.summary.needsLlmJudge ? 'warn' : 'good'}
        />
      </div>
      <DecisionTable decisions={result.decisions} />
    </>
  );
}

function AmbiguousResult({ result }: { result: AmbiguousDemoResponse }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryStat label="Events" value={result.summary.eventsConsidered} />
        <SummaryStat label="Expected kept" value={result.summary.expectedKept} />
        <SummaryStat
          label="Rules engine kept"
          value={result.summary.rulesEngineKept}
          tone={result.summary.rulesEngineKept === result.summary.expectedKept ? 'good' : 'warn'}
        />
        <SummaryStat
          label="Final kept (after judge)"
          value={result.summary.finalKept}
          tone={result.summary.finalKept === result.summary.expectedKept ? 'good' : 'warn'}
        />
      </div>

      {!result.summary.llmJudgeAvailable && (
        <div className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 text-amber-800 dark:text-amber-200">
          <strong>ANTHROPIC_API_KEY not set on the function.</strong> The judge couldn&apos;t run — set it via{' '}
          <code>firebase functions:secrets:set ANTHROPIC_API_KEY</code> then redeploy.
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2 text-text-secondary uppercase tracking-wide">
          Rules engine output (before judge)
        </h3>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border text-left">
              <tr>
                <th className="px-3 py-2 font-medium">id</th>
                <th className="px-3 py-2 font-medium">decision</th>
                <th className="px-3 py-2 font-medium">rule</th>
                <th className="px-3 py-2 font-medium">reason</th>
              </tr>
            </thead>
            <tbody>
              {result.rulesEngineDecisions.map(d => (
                <tr key={d.eventId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono">{d.eventId}</td>
                  <td className="px-3 py-2">
                    <DecisionBadge kept={d.kept} confidence={d.confidence} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-text-secondary">
                    {d.ruleId || '—'}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{d.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 text-text-secondary uppercase tracking-wide">
          Final output {result.summary.llmJudgeInvoked && '(after LLM judge)'}
        </h3>
        <DecisionTable decisions={result.finalDecisions} />
      </div>
    </>
  );
}

function DecisionTable({ decisions }: { decisions: DemoDecision[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-background border-b border-border text-left">
          <tr>
            <th className="px-3 py-2 font-medium">id</th>
            <th className="px-3 py-2 font-medium">+sec</th>
            <th className="px-3 py-2 font-medium">lie</th>
            <th className="px-3 py-2 font-medium">club considered</th>
            <th className="px-3 py-2 font-medium">decision</th>
            <th className="px-3 py-2 font-medium">rule</th>
            <th className="px-3 py-2 font-medium">reason</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map(d => (
            <tr key={d.eventId} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-mono">{d.eventId}</td>
              <td className="px-3 py-2 font-mono">{d.timestampOffsetSec}</td>
              <td className="px-3 py-2">{d.lie ?? '—'}</td>
              <td className="px-3 py-2">{d.clubConsidered ?? '—'}</td>
              <td className="px-3 py-2">
                <DecisionBadge kept={d.kept} confidence={d.confidence} />
              </td>
              <td className="px-3 py-2 font-mono text-xs text-text-secondary">
                {d.ruleId || '—'}
              </td>
              <td className="px-3 py-2 text-text-secondary">{d.reason || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DecisionBadge({ kept, confidence }: { kept: boolean; confidence: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        kept
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      }`}
    >
      {kept ? `kept (${confidence})` : 'dropped'}
    </span>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'good' | 'warn';
}) {
  const toneClasses =
    tone === 'good'
      ? 'text-green-600 dark:text-green-400'
      : tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-text-primary';
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-text-secondary uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold ${toneClasses}`}>{value}</div>
    </div>
  );
}
