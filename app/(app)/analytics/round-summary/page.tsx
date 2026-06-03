'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Mail, Send } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/hooks/useAuth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import {
  HOLES,
  buildHoleLandings,
  allDispersionShots,
  PGA_PROS,
  COURSE_INFO,
} from '@/lib/demo/kingRound';
import { DispersionChart, type DispersionChartHandle } from '@/components/analytics/DispersionChart';

const HoleChainMap = dynamic(() => import('@/components/analytics/HoleChainMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-text-secondary text-sm">
      Loading map…
    </div>
  ),
});

type Scope = 'round' | 'hole' | 'custom';

export default function RoundSummaryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [currentHole, setCurrentHole] = useState(1);
  const [scope, setScope] = useState<Scope>('round');
  const [enabledHoles, setEnabledHoles] = useState<Set<number>>(
    () => new Set(HOLES.map(h => h.holeNumber))
  );
  const [shareTo, setShareTo] = useState('');
  const [shareToName, setShareToName] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const chartRef = useRef<DispersionChartHandle>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // All shots — memoised so we only compute once
  const allShots = useMemo(() => allDispersionShots(), []);
  const visibleShots = useMemo(
    () => allShots.filter(s => enabledHoles.has(s.holeNumber)),
    [allShots, enabledHoles]
  );

  // When scope changes, update enabledHoles accordingly
  useEffect(() => {
    if (scope === 'round') {
      setEnabledHoles(new Set(HOLES.map(h => h.holeNumber)));
    } else if (scope === 'hole') {
      setEnabledHoles(new Set([currentHole]));
    }
    // 'custom' — leave alone
  }, [scope, currentHole]);

  const hole = HOLES[currentHole - 1];
  const landings = useMemo(() => buildHoleLandings(hole), [hole]);

  const totalScore = useMemo(() => HOLES.reduce((s, h) => s + h.score, 0), []);
  const totalPar = useMemo(() => HOLES.reduce((s, h) => s + h.par, 0), []);
  const scoreLabel = `${totalScore} (${totalScore - totalPar >= 0 ? '+' : ''}${totalScore - totalPar} vs par ${totalPar})`;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const scopeLabel =
    scope === 'round'
      ? 'whole round'
      : scope === 'hole'
      ? `hole ${currentHole}`
      : 'custom selection';

  function toggleHole(num: number) {
    setScope('custom');
    setEnabledHoles(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }

  async function downloadChartPng() {
    const svg = chartRef.current?.getSvg();
    if (!svg) return;
    setDownloading(true);
    try {
      const xml = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('image load failed'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1760;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const blob = await new Promise<Blob | null>(res =>
        canvas.toBlob(b => res(b), 'image/png')
      );
      URL.revokeObjectURL(url);
      if (!blob) return;
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `dispersion-${today}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
    } finally {
      setDownloading(false);
    }
  }

  async function sendViaLoops() {
    if (!shareTo.trim()) {
      setSendStatus({ kind: 'err', text: 'Add a recipient email or pick a pro from the dropdown.' });
      return;
    }
    if (!app) {
      setSendStatus({ kind: 'err', text: 'Firebase app not initialized.' });
      return;
    }
    setSending(true);
    setSendStatus(null);
    try {
      const fn = httpsCallable<unknown, { sent: boolean }>(getFunctions(app), 'sendShareRoundEmail');
      await fn({
        recipientEmail: shareTo.trim(),
        recipientName: shareToName.trim() || undefined,
        message: shareMessage.trim() || undefined,
        course: { name: COURSE_INFO.name, date: today },
        score: { total: totalScore, par: totalPar },
        shotsPlotted: visibleShots.length,
        courseLocation: `${COURSE_INFO.city}, ${COURSE_INFO.state}`,
      });
      setSendStatus({
        kind: 'ok',
        text: `Sent — ${shareTo.trim()} also added to your Loops audience as a referral.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Send failed';
      setSendStatus({ kind: 'err', text: msg });
    } finally {
      setSending(false);
    }
  }

  function openEmail() {
    if (!shareTo.trim()) {
      alert('Add a recipient email or pick a pro from the dropdown.');
      return;
    }
    const subject = `My round at ${COURSE_INFO.name} (dispersion chart attached)`;
    const message =
      shareMessage.trim() ||
      'Hi — please find my latest round dispersion attached. Looking forward to your feedback.';
    const lines = [
      `Course: ${COURSE_INFO.name}`,
      `Date: ${today}`,
      `Score: ${scoreLabel}`,
      `Shots plotted: ${visibleShots.length} of ${allShots.length} (${scopeLabel})`,
      '',
      message,
      '',
      '— Sent from CopperLine Golf round summary',
    ];
    window.location.href = `mailto:${encodeURIComponent(
      shareTo.trim()
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Round Summary</h1>
          <div className="ml-auto flex items-center gap-4 text-xs text-text-secondary">
            <div><span className="uppercase tracking-wider">Course</span> · {COURSE_INFO.name}</div>
            <div><span className="uppercase tracking-wider">Date</span> · {today}</div>
            <div><span className="uppercase tracking-wider">Player</span> · {user?.displayName ?? user?.email ?? 'You'}</div>
            <div><span className="uppercase tracking-wider">Score</span> · <strong className="text-text-primary">{scoreLabel}</strong></div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-4">
        {/* Hole nav */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentHole(n => Math.max(1, n - 1))}
            disabled={currentHole === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev hole
          </Button>
          <div className="flex-1 text-center">
            <div className="font-semibold">Hole {currentHole} / 18</div>
            <div className="text-xs text-text-secondary">
              Par {hole.par} · {hole.lengthYds} yd · Scored {hole.score} ({hole.putts} putts)
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentHole(n => Math.min(18, n + 1))}
            disabled={currentHole === 18}
          >
            Next hole
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Two-pane layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left pane — map */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-background border-b border-border text-xs text-text-secondary uppercase tracking-wider">
              Map · current hole only
            </div>
            <div className="h-[560px]">
              <HoleChainMap key={currentHole} hole={hole} landings={landings} />
            </div>
          </div>

          {/* Right pane — dispersion */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-background border-b border-border text-xs text-text-secondary uppercase tracking-wider">
              Dispersion · {scopeLabel}
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-3 text-xs flex-wrap">
                {(['round', 'hole', 'custom'] as Scope[]).map(s => (
                  <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value={s}
                      checked={scope === s}
                      onChange={() => setScope(s)}
                    />
                    {s === 'round' ? 'Whole round' : s === 'hole' ? 'Current hole only' : 'Custom selection ↓'}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                {HOLES.map(h => (
                  <label
                    key={h.holeNumber}
                    className={`flex items-center gap-1 cursor-pointer tabular-nums ${
                      h.par === 3
                        ? 'text-amber-700 dark:text-amber-400'
                        : h.par === 5
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-text-primary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabledHoles.has(h.holeNumber)}
                      onChange={() => toggleHole(h.holeNumber)}
                    />
                    {h.holeNumber}
                    <sup>p{h.par}</sup>
                  </label>
                ))}
              </div>
              <DispersionChart ref={chartRef} shots={visibleShots} />
            </div>
          </div>
        </div>

        {/* Share section */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">
            Share dispersion chart
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Recipient email</span>
              <input
                type="email"
                placeholder="anyone@example.com"
                value={shareTo}
                onChange={e => setShareTo(e.target.value)}
                className="px-3 py-2 border border-border rounded bg-background text-text-primary text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Recipient name (optional)</span>
              <input
                type="text"
                placeholder="Mike Larson"
                value={shareToName}
                onChange={e => setShareToName(e.target.value)}
                className="px-3 py-2 border border-border rounded bg-background text-text-primary text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Or pick a local PGA professional</span>
              <select
                className="px-3 py-2 border border-border rounded bg-background text-text-primary text-sm"
                onChange={e => {
                  const opt = e.target.options[e.target.selectedIndex];
                  setShareTo(e.target.value);
                  setShareToName(opt.dataset.name ?? '');
                }}
                value=""
              >
                <option value="">— pick a pro —</option>
                {PGA_PROS.map(p => (
                  <option key={p.email} value={p.email} data-name={p.name}>
                    {p.name} — {p.facility}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm mb-3">
            <span className="text-xs uppercase tracking-wider text-text-secondary">Message</span>
            <textarea
              rows={3}
              placeholder="Hi — here's my latest round at Starfire King. Could you take a look at my dispersion? Specifically interested in my driver and 7-iron tendencies."
              value={shareMessage}
              onChange={e => setShareMessage(e.target.value)}
              className="px-3 py-2 border border-border rounded bg-background text-text-primary text-sm"
            />
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={sendViaLoops} disabled={sending} variant="primary" size="sm" className="gap-1">
              <Send className="w-4 h-4" />
              {sending ? 'Sending…' : 'Send branded email'}
            </Button>
            <Button onClick={downloadChartPng} disabled={downloading} variant="outline" size="sm" className="gap-1">
              <Download className="w-4 h-4" />
              {downloading ? 'Building PNG…' : 'Download chart as PNG'}
            </Button>
            <Button onClick={openEmail} variant="outline" size="sm" className="gap-1">
              <Mail className="w-4 h-4" />
              Open in email app
            </Button>
          </div>
          {sendStatus && (
            <div
              className={`mt-3 text-xs rounded-lg p-2 ${
                sendStatus.kind === 'ok'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
              }`}
            >
              {sendStatus.text}
            </div>
          )}
          <p className="mt-2 text-xs text-text-secondary">
            <strong>Send branded email</strong> goes through Loops with your CopperLine Golf template — the
            recipient also gets added to your audience as a referral, so you can follow up from Loops.
            The other two buttons are fallbacks: download the chart PNG, then open in your own email app.
          </p>
        </div>
      </div>
    </div>
  );
}
