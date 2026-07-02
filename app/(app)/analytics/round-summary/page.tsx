'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Mail, Send } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { app, db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import {
  HOLES as DEMO_HOLES,
  buildHoleLandings,
  bearingBetween,
  distanceYards,
  dispersionFor,
  PGA_PROS,
  COURSE_INFO,
  type ResolvedHole,
  type DispersionShot,
  type HoleLanding,
  type LatLng,
} from '@/lib/demo/kingRound';
import {
  listUserRounds,
  loadRound,
  type RoundListItem,
  type CallRecommendation,
} from '@/lib/api/userRounds';
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

// The branded-email flow routes through the owner's Loops account and adds
// recipients to the owner's audience as referrals, so the Loops-specific
// messaging is only shown to the owner. Mirrors ADMIN_EMAIL in app/admin/page.tsx.
const OWNER_EMAIL = 'scott.roelofs@rcgvaluation.com';

export default function RoundSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const isOwner = user?.email === OWNER_EMAIL;

  const [currentHole, setCurrentHole] = useState(1);
  const [scope, setScope] = useState<Scope>('round');
  const [shareTo, setShareTo] = useState('');
  const [shareToName, setShareToName] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const chartRef = useRef<DispersionChartHandle>(null);

  // Round source: either the synthetic demo or a real /scores doc
  const [roundList, setRoundList] = useState<RoundListItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<'demo' | string>(
    () => searchParams.get('round') ?? 'demo'
  );

  // If the URL ?round= changes after mount (e.g. clicked another round link),
  // re-sync the selection.
  useEffect(() => {
    const fromUrl = searchParams.get('round');
    if (fromUrl && fromUrl !== selectedRoundId) setSelectedRoundId(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [loadedHoles, setLoadedHoles] = useState<ResolvedHole[] | null>(null);
  const [loadedMeta, setLoadedMeta] = useState<{
    courseId?: string;
    courseName: string;
    date: string;
    totalScore: number;
    totalPar: number;
    hasFullGeometry: boolean;
    mode?: 'scorecard' | 'calls';
    callCount?: number;
  } | null>(null);
  // Which collection the loaded round lives in — for persisting shot overrides.
  const [roundSource, setRoundSource] = useState<'scores' | 'rounds'>('scores');
  const [roundLoading, setRoundLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // Calls mode: primary + secondary recommendation(s) per hole number.
  const [recsByHole, setRecsByHole] = useState<Record<number, CallRecommendation[]>>({});
  // Real fairway polygon per hole (from /courseHoles) for the map boundary.
  const [fairwayByHole, setFairwayByHole] = useState<Record<number, LatLng[]>>({});

  // Active round data (demo or loaded)
  const activeHoles = loadedHoles ?? DEMO_HOLES;

  // Per-hole landings (mutable — drag updates these). Initialized lazily
  // when a hole is first viewed. Drives both the map markers and the
  // dispersion chart, so dragging a marker propagates everywhere live.
  const [landingsByHole, setLandingsByHole] = useState<Record<number, HoleLanding[]>>({});

  const [enabledHoles, setEnabledHoles] = useState<Set<number>>(
    () => new Set(DEMO_HOLES.map(h => h.holeNumber))
  );

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Load list of real rounds for the dropdown once authenticated
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listUserRounds(user.uid, 50)
      .then(list => { if (!cancelled) setRoundList(list); })
      .catch(err => console.warn('[round-summary] list rounds failed:', err));
    return () => { cancelled = true; };
  }, [user]);

  // When the selection changes, load that round (or revert to demo)
  useEffect(() => {
    setLandingsByHole({}); // wipe landings whenever the round changes
    setRecsByHole({});
    setFairwayByHole({});
    setNotFound(false);
    if (selectedRoundId === 'demo') {
      setLoadedHoles(null);
      setLoadedMeta(null);
      setCurrentHole(1);
      return;
    }
    let cancelled = false;
    setRoundLoading(true);
    loadRound(selectedRoundId)
      .then(r => {
        if (cancelled) return;
        if (!r) {
          // Don't silently fall back to the demo — tell the user the round is missing.
          setLoadedHoles(null);
          setLoadedMeta(null);
          setNotFound(true);
          return;
        }
        setLoadedHoles(r.holes);
        setLoadedMeta(r.meta);
        setRoundSource(r.sourceCollection ?? 'scores');
        // Calls mode provides real landing positions (where each optimizer call
        // was made) — seed them so the map/dispersion plot actual data instead
        // of synthesizing a shot chain.
        if (r.landingsByHole) setLandingsByHole(r.landingsByHole);
        // Scorecard mode: apply any saved per-shot landing overrides on top of
        // the synthesized chain, so the user's corrected positions persist.
        else if (r.landingOverrides) {
          const seeded: Record<number, HoleLanding[]> = {};
          for (const h of r.holes) {
            const ov = r.landingOverrides[h.holeNumber];
            if (!ov) continue;
            const base = buildHoleLandings(h);
            seeded[h.holeNumber] = base.map((l, i) => (ov[i] ? { ...l, land: ov[i] } : l));
          }
          if (Object.keys(seeded).length) setLandingsByHole(seeded);
        }
        setRecsByHole(r.recommendationsByHole ?? {});
        setFairwayByHole(r.fairwayByHole ?? {});
        setCurrentHole(1);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[round-summary] load round failed:', err);
        setLoadedHoles(null);
        setLoadedMeta(null);
        setNotFound(true);
      })
      .finally(() => { if (!cancelled) setRoundLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRoundId]);

  // Ensure landings exist for every active hole — initialize lazily.
  // Rebuild when missing OR when a stored entry's length no longer matches the
  // hole's shot count: switching rounds reuses hole numbers, so a stale entry
  // from the previous round would otherwise be indexed against a different
  // shot chain (causing landings[i] to be undefined downstream).
  useEffect(() => {
    // Don't seed landings from DEMO_HOLES while a real round is still loading —
    // activeHoles falls back to the demo (Scottsdale) holes until loadRound
    // resolves, and those coords could otherwise leak into (and get persisted
    // for) the real round. Wait until the real holes are in.
    if (selectedRoundId !== 'demo' && !loadedHoles) return;
    setLandingsByHole(prev => {
      const next = { ...prev };
      let changed = false;
      for (const h of activeHoles) {
        const stored = next[h.holeNumber];
        if (!stored || stored.length !== h.shots.length) {
          next[h.holeNumber] = buildHoleLandings(h);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeHoles, selectedRoundId, loadedHoles]);

  // Keep enabledHoles in sync with active round + scope
  useEffect(() => {
    if (scope === 'round') {
      setEnabledHoles(new Set(activeHoles.map(h => h.holeNumber)));
    } else if (scope === 'hole') {
      setEnabledHoles(new Set([currentHole]));
    }
    // 'custom' — leave as-is
  }, [scope, currentHole, activeHoles]);

  // Dispersion is derived from the current landings — so drags update it live.
  const activeShots: DispersionShot[] = useMemo(() => {
    const out: DispersionShot[] = [];
    for (const h of activeHoles) {
      const landings = landingsByHole[h.holeNumber];
      if (!landings) continue;
      landings.forEach((l, i) => {
        const pos = dispersionFor(h, l.land);
        out.push({
          holeNumber: h.holeNumber,
          shotNumber: i + 1,
          label: `${h.holeNumber}/${i + 1}`,
          lie: l.lie,
          distFromPin: pos.distFromPin,
          lateral: pos.lateral,
        });
      });
    }
    return out;
  }, [activeHoles, landingsByHole]);

  const visibleShots = useMemo(
    () => activeShots.filter(s => enabledHoles.has(s.holeNumber)),
    [activeShots, enabledHoles]
  );

  const hole = activeHoles[Math.min(currentHole, activeHoles.length) - 1] ?? activeHoles[0];
  // Use the stored landings only if they match the current hole's shot count;
  // otherwise build fresh. Guards the render that happens after the active
  // round changes but before the lazy-init effect above has rebuilt entries.
  const storedLandings = landingsByHole[hole.holeNumber];
  const landings =
    storedLandings && storedLandings.length === hole.shots.length
      ? storedLandings
      : buildHoleLandings(hole);

  function onLandingChange(shotIndex: number, latLng: LatLng) {
    setLandingsByHole(prev => {
      const current = prev[hole.holeNumber];
      if (!current) return prev;
      const updated = current.map((l, i) =>
        i === shotIndex ? { ...l, land: latLng } : l
      );
      return { ...prev, [hole.holeNumber]: updated };
    });
  }

  // Persist a dragged shot landing onto the round doc so it survives reloads.
  async function onLandingCommit(shotIndex: number, latLng: LatLng) {
    if (!db || selectedRoundId === 'demo') return;
    const holeNum = hole.holeNumber;
    const current = landingsByHole[holeNum] ?? buildHoleLandings(hole);
    const updated = current.map((l, i) => (i === shotIndex ? { ...l, land: latLng } : l));
    // Never persist a landing implausibly far from the tee — guards against any
    // stale/demo coords slipping into the saved overrides. No hole is > ~1500y.
    if (updated.some(l => distanceYards(hole.tee, l.land) > 1500)) {
      console.warn('[round-summary] skip persist: landing far from tee');
      return;
    }
    const coords = updated.map(l => ({ lat: l.land.lat, lng: l.land.lng }));
    try {
      await updateDoc(doc(db, roundSource, selectedRoundId), {
        [`landingOverrides.${holeNum}`]: coords,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('[round-summary] persist landing failed:', err);
    }
  }

  // Owner-only: move a hole's tee or pin and save it to the shared course
  // geometry (via the admin route — the browser can't write /courses directly).
  async function persistGeometry(kind: 'tee' | 'pin', latLng: LatLng) {
    const courseId = loadedMeta?.courseId;
    if (!courseId || !user) return;
    // Optimistic local update so the map + dispersion react immediately.
    setLoadedHoles(prev =>
      prev
        ? prev.map(h => {
            if (h.holeNumber !== hole.holeNumber) return h;
            const tee = kind === 'tee' ? latLng : h.tee;
            const green = kind === 'pin' ? latLng : h.green;
            return { ...h, tee, green, bearing: bearingBetween(tee, green) };
          })
        : prev
    );
    try {
      const token = await user.getIdToken();
      const body =
        kind === 'tee'
          ? { courseId, holeNumber: hole.holeNumber, teeBox: { latitude: latLng.lat, longitude: latLng.lng } }
          : { courseId, holeNumber: hole.holeNumber, greenCenter: { latitude: latLng.lat, longitude: latLng.lng } };
      const res = await fetch('/api/admin/course-geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.warn('[round-summary] geometry save failed:', j);
      }
    } catch (err) {
      console.warn('[round-summary] geometry save failed:', err);
    }
  }

  const isCallsMode = loadedMeta?.mode === 'calls';
  // Owner can drag the tee/pin to correct the shared course geometry — only
  // when the hole has real geometry (not synthetic) and a course to save to.
  const canEditGeometry = isOwner && !isCallsMode && !!loadedMeta?.courseId && !!loadedMeta?.hasFullGeometry;
  const totalScore = loadedMeta?.totalScore ?? activeHoles.reduce((s, h) => s + h.score, 0);
  const totalPar = loadedMeta?.totalPar ?? activeHoles.reduce((s, h) => s + h.par, 0);
  // In calls mode there is no score — show how many caddy calls we captured.
  const scoreLabel = isCallsMode
    ? `${loadedMeta?.callCount ?? totalScore} caddy calls · round not finished`
    : `${totalScore} (${totalScore - totalPar >= 0 ? '+' : ''}${totalScore - totalPar} vs par ${totalPar})`;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const activeCourseName = loadedMeta?.courseName ?? COURSE_INFO.name;
  const activeDate = loadedMeta?.date ?? today;

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
        course: { name: activeCourseName, date: activeDate },
        score: { total: totalScore, par: totalPar },
        shotsPlotted: visibleShots.length,
        courseLocation: selectedRoundId === 'demo' ? `${COURSE_INFO.city}, ${COURSE_INFO.state}` : '',
      });
      setSendStatus({
        kind: 'ok',
        text: isOwner
          ? `Sent — ${shareTo.trim()} also added to your Loops audience as a referral.`
          : `Sent — branded email delivered to ${shareTo.trim()}.`,
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
    const subject = `My round at ${activeCourseName} (dispersion chart attached)`;
    const message =
      shareMessage.trim() ||
      'Hi — please find my latest round dispersion attached. Looking forward to your feedback.';
    const lines = [
      `Course: ${activeCourseName}`,
      `Date: ${activeDate}`,
      `Score: ${scoreLabel}`,
      `Shots plotted: ${visibleShots.length} of ${activeShots.length} (${scopeLabel})`,
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
      {/* Non-sticky: scrolls away with the page so it never overlaps the map /
          dispersion content below (a sticky header bled through over Leaflet). */}
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Round Summary</h1>

          <label className="flex items-center gap-2 text-xs">
            <span className="text-text-secondary uppercase tracking-wider">Round</span>
            <select
              value={selectedRoundId}
              onChange={e => {
                const v = e.target.value as 'demo' | string;
                setSelectedRoundId(v);
                const url = v === 'demo'
                  ? '/analytics/round-summary'
                  : `/analytics/round-summary?round=${encodeURIComponent(v)}`;
                router.replace(url);
              }}
              disabled={roundLoading}
              className="px-2 py-1 border border-border rounded bg-background text-text-primary text-xs min-w-[300px]"
            >
              <option value="demo">Demo · The King — Starfire (95)</option>
              {roundList.length > 0 && <option disabled>──────────</option>}
              {roundList.map(r => (
                <option key={r.id} value={r.id}>
                  {r.date} · {r.courseName} · {r.grossScore}
                  {r.par ? ` (${r.scoreVsPar >= 0 ? '+' : ''}${r.scoreVsPar} vs ${r.par})` : ''}
                </option>
              ))}
            </select>
            {roundLoading && <span className="text-text-secondary text-xs">loading…</span>}
          </label>
          </div>

          {!notFound && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
              <div><span className="uppercase tracking-wider">Course</span> · {activeCourseName}</div>
              <div><span className="uppercase tracking-wider">Date</span> · {activeDate}</div>
              <div><span className="uppercase tracking-wider">Player</span> · {user?.displayName ?? user?.email ?? 'You'}</div>
              <div><span className="uppercase tracking-wider">Score</span> · <strong className="text-text-primary">{scoreLabel}</strong></div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-4">
        {/* Related analytics views */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-text-secondary mr-1 self-center uppercase tracking-wider">Also see:</span>
          <Link href="/analytics" className="px-3 py-1 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors">
            All analytics
          </Link>
          <Link href="/analytics/shot-map" className="px-3 py-1 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors">
            Shot map
          </Link>
          <Link href="/analytics/dispersion" className="px-3 py-1 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors">
            Dispersion (approach)
          </Link>
          <Link href="/analytics/recommendations" className="px-3 py-1 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors">
            AI recommendations
          </Link>
          <Link href="/scores" className="px-3 py-1 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors">
            Score history
          </Link>
          <Link href="/clubs" className="px-3 py-1 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors">
            Manage clubs
          </Link>
        </div>

        {notFound && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Round not found</h2>
            <p className="text-sm text-text-secondary mb-4">
              We couldn&apos;t load this round — it may have been deleted, or it belongs to another
              account. Pick a different round from the selector above, or head back to your analytics.
            </p>
            <Link href="/analytics">
              <Button variant="outline" size="sm">Back to analytics</Button>
            </Link>
          </div>
        )}

        {!notFound && (
        <>
        {/* Owner-only diagnostic: tells the account owner how to seed missing
            course geometry. Other users shouldn't see this technical message. */}
        {isOwner && selectedRoundId !== 'demo' && loadedMeta && !loadedMeta.hasFullGeometry && (
          <div className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
            <strong>Heads up:</strong> course geometry for this round isn&apos;t in Firestore yet,
            so the per-hole map uses synthetic coords. The dispersion chart is computed from
            your scorecard and is accurate. Add the course in <code>/courses/&#123;courseId&#125;</code>
            with <code>gpsData.teeBox</code> + <code>gpsData.greenCenter</code> per hole and the
            map will light up.
          </div>
        )}

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
            <div className="font-semibold">
              {isCallsMode
                ? `Hole ${hole.holeNumber} (${currentHole} of ${activeHoles.length} engaged)`
                : `Hole ${currentHole} / ${activeHoles.length}`}
            </div>
            <div className="text-xs text-text-secondary">
              {isCallsMode
                ? `Par ${hole.par} · ${hole.lengthYds} yd · ${hole.shots.length} caddy call${hole.shots.length === 1 ? '' : 's'}`
                : `Par ${hole.par} · ${hole.lengthYds} yd · Scored ${hole.score} (${hole.putts} putts)`}
            </div>
            {isCallsMode && (recsByHole[hole.holeNumber] ?? []).map((rec, i) => (
              <div key={i} className="text-xs mt-0.5">
                <span className="text-primary font-semibold">{rec.primaryClub}</span>
                {rec.primaryCarry ? <span className="text-text-secondary"> {rec.primaryCarry}y</span> : null}
                {rec.secondaryClub && (
                  <span className="text-text-secondary">
                    {' '}· backup <span className="text-text-primary">{rec.secondaryClub}</span>
                    {rec.secondaryCarry ? ` ${rec.secondaryCarry}y` : ''}
                  </span>
                )}
                {rec.target ? <span className="text-text-secondary"> · {rec.target}</span> : null}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentHole(n => Math.min(activeHoles.length, n + 1))}
            disabled={currentHole >= activeHoles.length}
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
              {roundLoading ? (
                // Don't render the map with the previous round's holes while the
                // newly-selected round is still loading — otherwise it mounts on
                // the old course's coordinates (e.g. shows Flagstaff for a
                // Scottsdale round) until the data arrives.
                <div className="h-full w-full flex items-center justify-center text-text-secondary text-sm">
                  Loading map…
                </div>
              ) : (
                <HoleChainMap
                  key={`${selectedRoundId}-${currentHole}`}
                  hole={hole}
                  landings={landings}
                  fairwayPolygon={fairwayByHole[hole.holeNumber]}
                  recommendationOnly={isCallsMode}
                  onLandingChange={isCallsMode ? undefined : onLandingChange}
                  onLandingCommit={isCallsMode || selectedRoundId === 'demo' ? undefined : onLandingCommit}
                  onTeeChange={canEditGeometry ? (ll) => persistGeometry('tee', ll) : undefined}
                  onPinChange={canEditGeometry ? (ll) => persistGeometry('pin', ll) : undefined}
                />
              )}
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
                {activeHoles.map(h => (
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
            {isOwner ? (
              <>
                <strong>Send branded email</strong> goes through Loops with your CopperLine Golf template — the
                recipient also gets added to your audience as a referral, so you can follow up from Loops.
                The other two buttons are fallbacks: download the chart PNG, then open in your own email app.
              </>
            ) : (
              <>
                <strong>Send branded email</strong> delivers your dispersion chart with the CopperLine Golf
                template. The other two buttons are fallbacks: download the chart PNG, then open in your own
                email app.
              </>
            )}
          </p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
