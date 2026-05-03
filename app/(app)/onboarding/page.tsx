'use client';

/**
 * Post-signup profile walkthrough.
 *
 * Mirrors the React Native app's 9-step ProfileOnboardingFlow, adapted for web:
 * 7 data-capture steps (mobile-only tutorials are dropped). Writes to the three
 * profile collections (`profiles`, `userProfiles`, `playerProfiles`) plus
 * `clubs/{uid}`, `shots/{uid}`, `preferences/{uid}`, and the
 * `users/{uid}.profileComplete` flag the AppGate gates on.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { useAuth } from '@/hooks/useAuth';
import { updateUserSetupFlags } from '@/services/authService';
import { initializeNewUser } from '@/services/initializationService';
import { notifyLoops } from '@/services/loopsClient';
import { generateDefaultClubs } from '@/src/types/clubs';
import type { UserProfile } from '@/src/types/user';

// ============================================================================
// TYPES — match the RN app's exact value casing for cross-platform sync
// ============================================================================

type Hand = 'Right' | 'Left';
type ShotShape = 'Draw' | 'Straight' | 'Fade';
type ShotHeight = 'Low' | 'Medium' | 'High';
type AgeGroup = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
type PlayFreq = 'rarely' | 'occasionally' | 'regularly' | 'frequently' | 'very-frequently';
type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Tour Pro';
type Verbosity = 'talk_it_through' | 'just_facts' | 'minimal';
type TargetMode = 'target' | 'ellipse';

const TOTAL_STEPS = 7;

const PLAY_FREQUENCIES: { value: PlayFreq; label: string; description: string }[] = [
  { value: 'rarely', label: 'Rarely', description: '< 5 rounds/year' },
  { value: 'occasionally', label: 'Occasionally', description: '5–15 rounds/year' },
  { value: 'regularly', label: 'Regularly', description: '15–30 rounds/year' },
  { value: 'frequently', label: 'Frequently', description: '30–50 rounds/year' },
  { value: 'very-frequently', label: 'Very Frequently', description: '> 50 rounds/year' },
];

const AGE_GROUPS: AgeGroup[] = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

const SKILL_OPTIONS: { value: SkillLevel; label: string; handicapRange: string }[] = [
  { value: 'Beginner', label: 'Beginner', handicapRange: '26+ handicap' },
  { value: 'Intermediate', label: 'Intermediate', handicapRange: '15–25' },
  { value: 'Advanced', label: 'Advanced', handicapRange: '5–14' },
  { value: 'Tour Pro', label: 'Tour Pro', handicapRange: '< 5' },
];

const VERBOSITY_OPTIONS: { value: Verbosity; label: string; description: string; sample: string }[] = [
  {
    value: 'talk_it_through',
    label: 'Talk it Through',
    description: 'Full conversation — your caddie reads the situation aloud and asks questions.',
    sample: '“145 yards to the pin, slight headwind, pin tucked back-right behind a bunker. Your typical 7-iron carries 145 with a slight draw. Lie and stance?”',
  },
  {
    value: 'just_facts',
    label: 'Just the Facts',
    description: 'Quick exchange — your caddie only asks what it needs.',
    sample: '“145 yards. 7-iron. What’s your lie?”',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'You speak first — describe lie and stance, get a recommendation.',
    sample: '“Tell me your lie and stance.”',
  },
];

function suggestSkillLevel(hcp: number): SkillLevel {
  if (hcp < 5) return 'Tour Pro';
  if (hcp < 15) return 'Advanced';
  if (hcp < 26) return 'Intermediate';
  return 'Beginner';
}

// Web-shape (lowercase) ↔ mobile-shape (capitalized) converters
const handToWeb = (h: Hand): 'right' | 'left' => (h === 'Right' ? 'right' : 'left');
const shapeToWeb = (s: ShotShape): 'draw' | 'straight' | 'fade' =>
  s === 'Draw' ? 'draw' : s === 'Fade' ? 'fade' : 'straight';
const freqToWeb = (f: PlayFreq): 'weekly' | 'monthly' | 'occasionally' | 'rarely' => {
  switch (f) {
    case 'very-frequently':
    case 'frequently':
      return 'weekly';
    case 'regularly':
      return 'monthly';
    case 'occasionally':
      return 'occasionally';
    default:
      return 'rarely';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Ellipse
  const [playerName, setPlayerName] = useState('');
  const [dominantHand, setDominantHand] = useState<Hand>('Right');
  const [handicap, setHandicap] = useState<number>(15);

  // Step 2: About You
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('35-44');
  const [yearsPlaying, setYearsPlaying] = useState<number>(5);
  const [playFrequency, setPlayFrequency] = useState<PlayFreq>('regularly');

  // Step 3: Shot Shape
  const [naturalShot, setNaturalShot] = useState<ShotShape>('Straight');
  const [shotHeight, setShotHeight] = useState<ShotHeight>('Medium');
  const [yardsOfCurve5i, setYardsOfCurve5i] = useState<number>(5);

  // Step 5: AI Caddie
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate');
  const [skillUserEdited, setSkillUserEdited] = useState(false);
  const [verbosity, setVerbosity] = useState<Verbosity>('talk_it_through');

  // Step 6: Target Overlay
  const [targetOverlayMode, setTargetOverlayMode] = useState<TargetMode>('ellipse');

  // Auto-suggest skill level from handicap until the user explicitly edits it.
  useEffect(() => {
    if (skillUserEdited) return;
    setSkillLevel(suggestSkillLevel(handicap));
  }, [handicap, skillUserEdited]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const progress = useMemo(() => Math.round(((step + 1) / TOTAL_STEPS) * 100), [step]);
  const handicapValid = Number.isFinite(handicap) && handicap >= -12 && handicap <= 54;

  const markOnboardingComplete = async (uid: string) => {
    try {
      await updateUserSetupFlags(uid, { profileComplete: true, onboardingComplete: true });
    } catch (err) {
      console.error('[Onboarding] updateDoc flag write failed, falling back to setDoc:', err);
      const db = getFirestore(getApps()[0]);
      await setDoc(
        doc(db, 'users', uid),
        { profileComplete: true, onboardingComplete: true },
        { merge: true }
      );
    }
  };

  const handleSkip = async () => {
    if (!user || saving) return;
    setSaving(true);
    setError(null);
    try {
      await markOnboardingComplete(user.uid);
    } catch (err) {
      console.error('[Onboarding] Skip flag write failed (non-blocking):', err);
    }
    router.replace('/dashboard');
  };

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    setError(null);

    try {
      const db = getFirestore(getApps()[0]);
      const now = Date.now();
      const nowIso = new Date().toISOString();

      // Web profile shape (lowercase values, uses curveTendency)
      const webProfile: Record<string, any> = {
        userId: user.uid,
        dominantHand: handToWeb(dominantHand),
        typicalShotShape: shapeToWeb(naturalShot),
        height: 70,
        playFrequency: freqToWeb(playFrequency),
        skillLevel,
        ageGroup,
        yearsPlaying,
        verbosity,
        targetOverlayMode,
        updatedAt: now,
      };
      if (handicapValid) {
        webProfile.handicap = handicap;
        const signedCurve = naturalShot === 'Fade' ? yardsOfCurve5i : naturalShot === 'Draw' ? -yardsOfCurve5i : 0;
        webProfile.curveTendency = Math.max(-10, Math.min(10, Math.round(signedCurve / 2)));
      }
      if (playerName.trim()) webProfile.playerName = playerName.trim();

      // Mobile player profile shape (capitalized values, uses yardsOfCurve5i)
      const playerProfile: Record<string, any> = {
        userId: user.uid,
        dominantHand,
        naturalShot,
        shotHeight,
        yardsOfCurve5i,
        ageGroup,
        yearsPlaying,
        playFrequency,
        skillLevel,
        verbosity,
        targetOverlayMode,
        updatedAt: nowIso,
      };
      if (handicapValid) playerProfile.handicap = handicap;
      if (playerName.trim()) playerProfile.playerName = playerName.trim();

      try {
        const existingProfile = await getDoc(doc(db, 'profiles', user.uid));
        const isNew = !existingProfile.exists();
        if (isNew) {
          webProfile.createdAt = now;
          playerProfile.createdAt = nowIso;
        }

        await Promise.allSettled([
          setDoc(doc(db, 'profiles', user.uid), webProfile, { merge: true }),
          setDoc(doc(db, 'userProfiles', user.uid), webProfile, { merge: true }),
          setDoc(doc(db, 'playerProfiles', user.uid), playerProfile, { merge: true }),
        ]);

        if (isNew) {
          await initializeNewUser(user.uid, webProfile as UserProfile);
        }
      } catch (writeErr) {
        console.error('[Onboarding] Profile data write failed (non-blocking):', writeErr);
      }

      await markOnboardingComplete(user.uid);

      // Push the new profile properties to Loops so segment/trigger emails
      // (e.g. the "Transform Your Game" loop) can fire on profileComplete.
      // Best-effort — never block dashboard navigation on this.
      try {
        const [firstName, ...rest] = playerName.trim().split(/\s+/).filter(Boolean);
        await notifyLoops({
          ...(firstName ? { firstName } : {}),
          ...(rest.length ? { lastName: rest.join(' ') } : {}),
          profileComplete: true,
          onboardingComplete: true,
          ...(handicapValid ? { handicap } : {}),
          skillLevel,
          playFrequency: freqToWeb(playFrequency),
          yearsPlaying,
          dominantHand: handToWeb(dominantHand),
          naturalShot: shapeToWeb(naturalShot),
          shotHeight: shotHeight.toLowerCase(),
        });
      } catch (loopsErr) {
        console.error('[Onboarding] Loops notify failed (non-blocking):', loopsErr);
      }

      router.replace('/dashboard');
    } catch (err) {
      console.error('[Onboarding] Save failed:', err);
      setError('We couldn\'t save your profile right now. You can skip for now and finish it later from your profile page.');
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-text-muted mb-2">
            <span>Step {step + 1} of {TOTAL_STEPS}</span>
            <div className="flex items-center gap-3">
              <span>{progress}%</span>
              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                className="text-text-muted hover:text-text-primary underline disabled:opacity-40"
              >
                Skip for now
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-secondary-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            This profile is optional — you can skip and update anything later from your profile page.
          </p>
        </div>

        <div className="bg-secondary rounded-xl p-6 sm:p-8 border border-secondary-700">
          {step === 0 && (
            <StepEllipse
              playerName={playerName}
              setPlayerName={setPlayerName}
              dominantHand={dominantHand}
              setDominantHand={setDominantHand}
              handicap={handicap}
              setHandicap={setHandicap}
            />
          )}
          {step === 1 && (
            <StepAboutYou
              ageGroup={ageGroup}
              setAgeGroup={setAgeGroup}
              yearsPlaying={yearsPlaying}
              setYearsPlaying={setYearsPlaying}
              playFrequency={playFrequency}
              setPlayFrequency={setPlayFrequency}
            />
          )}
          {step === 2 && (
            <StepShotShape
              naturalShot={naturalShot}
              setNaturalShot={setNaturalShot}
              shotHeight={shotHeight}
              setShotHeight={setShotHeight}
              yardsOfCurve5i={yardsOfCurve5i}
              setYardsOfCurve5i={setYardsOfCurve5i}
              dominantHand={dominantHand}
            />
          )}
          {step === 3 && (
            <StepClubs handicap={handicap} naturalShot={naturalShot} />
          )}
          {step === 4 && (
            <StepAICaddie
              handicap={handicap}
              skillLevel={skillLevel}
              setSkillLevel={(v) => { setSkillUserEdited(true); setSkillLevel(v); }}
              skillUserEdited={skillUserEdited}
              verbosity={verbosity}
              setVerbosity={setVerbosity}
            />
          )}
          {step === 5 && (
            <StepTargetOverlay
              targetOverlayMode={targetOverlayMode}
              setTargetOverlayMode={setTargetOverlayMode}
              handicap={handicap}
            />
          )}
          {step === 6 && (
            <StepReview
              values={{
                playerName, dominantHand, handicap, ageGroup, yearsPlaying, playFrequency,
                naturalShot, shotHeight, yardsOfCurve5i, skillLevel, verbosity, targetOverlayMode,
              }}
            />
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">{error}</div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
              className="px-5 py-2.5 rounded-lg border-2 border-primary text-primary disabled:opacity-40"
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg border-2 border-secondary-700 text-text-muted hover:text-text-primary disabled:opacity-40"
              >
                Skip
              </button>
              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Finish Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SHARED UI HELPERS
// ============================================================================

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="mt-2 text-text-muted">{subtitle}</p>}
    </div>
  );
}

function Choice<T extends string>({
  value, current, onClick, children,
}: { value: T; current: T; onClick: (v: T) => void; children: React.ReactNode }) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      aria-pressed={active}
      className={`p-4 rounded-lg border-2 transition-all ${
        active
          ? 'border-primary bg-primary/10 text-primary font-medium'
          : 'border-secondary-700 text-text-muted hover:border-secondary-600 hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// STEP 1 — Ellipse: handedness + handicap with live dispersion ellipse
// ============================================================================

function StepEllipse({
  playerName, setPlayerName, dominantHand, setDominantHand, handicap, setHandicap,
}: {
  playerName: string; setPlayerName: (v: string) => void;
  dominantHand: Hand; setDominantHand: (v: Hand) => void;
  handicap: number; setHandicap: (v: number) => void;
}) {
  // Match RN: dispersion-with-driver formula from OnboardingEllipseScreen.tsx:231
  const dispersionYards = useMemo(
    () => Math.round(260 * (0.12 + (Math.max(0, handicap) / 54) * 0.19)),
    [handicap]
  );

  return (
    <div>
      <SectionHeader
        title="Your landing zone"
        subtitle="See how your handicap and dominant hand affect your shot dispersion."
      />

      <EllipseViz handicap={handicap} dominantHand={dominantHand} />

      <div className="mt-3 rounded-lg bg-background/40 border border-secondary-700 p-3 text-center">
        <div className="text-xs text-text-muted">Estimated dispersion with Driver</div>
        <div className="text-2xl font-bold text-primary mt-0.5">{dispersionYards}y wide</div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Your name (optional)</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="e.g. Scott"
            className="w-full px-4 py-3 bg-background border border-secondary-700 rounded-lg text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Dominant hand</label>
          <div className="grid grid-cols-2 gap-3">
            <Choice value="Right" current={dominantHand} onClick={setDominantHand}>Right</Choice>
            <Choice value="Left" current={dominantHand} onClick={setDominantHand}>Left</Choice>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text-primary">Handicap</label>
          <input
            type="number"
            min={-12}
            max={54}
            value={handicap}
            onChange={(e) => setHandicap(Number(e.target.value))}
            className="w-20 px-3 py-1.5 bg-background border border-secondary-700 rounded-lg text-text-primary text-right"
          />
        </div>
        <input
          type="range"
          min={-12}
          max={54}
          step={1}
          value={handicap}
          onChange={(e) => setHandicap(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>+12</span>
          <span>Scratch</span>
          <span>54</span>
        </div>
      </div>
    </div>
  );
}

// Constants ported verbatim from RN EllipseDemo.tsx:27-32
const ELLIPSE_BASE_W = 40;
const ELLIPSE_MAX_W = 120;
const ELLIPSE_BASE_H = 60;
const ELLIPSE_MAX_H = 160;
const ELLIPSE_RH_ROT = 15;   // degrees
const ELLIPSE_LH_ROT = -15;  // degrees

function EllipseViz({ handicap, dominantHand }: { handicap: number; dominantHand: Hand }) {
  // Matches RN: negative handicaps clamp to 0; size grows linearly to MAX at 54.
  const normalizedHdcp = Math.min(54, Math.max(0, handicap)) / 54;
  const ellipseW = ELLIPSE_BASE_W + normalizedHdcp * (ELLIPSE_MAX_W - ELLIPSE_BASE_W);
  const ellipseH = ELLIPSE_BASE_H + normalizedHdcp * (ELLIPSE_MAX_H - ELLIPSE_BASE_H);
  const rotation = dominantHand === 'Right' ? ELLIPSE_RH_ROT : ELLIPSE_LH_ROT;

  // viewBox 300×220 to match RN container dimensions
  const W = 300;
  const H = 220;
  const cx = W / 2;
  const cy = H / 2;

  // RN renders rx=ellipseHeight, ry=ellipseWidth (intentional — names are
  // semantic, not axis-aligned, since the whole thing rotates).
  // Glow uses identity interpolation [0,200]→[0,200]; main ellipse is 75%.
  const glowRx = ellipseH;
  const glowRy = ellipseW;
  const mainRx = ellipseH * 0.75;
  const mainRy = ellipseW * 0.75;

  // Mow lines from RN: 7 stripes spaced 20 apart, starting at centerX-60
  const mowLines = Array.from({ length: 7 }, (_, i) => cx - 60 + i * 20);

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-secondary-700"
      style={{ background: '#1a2f23' }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56 sm:h-64 block">
        <defs>
          <linearGradient id="fairwayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a3d1a" />
            <stop offset="50%" stopColor="#2D7A47" />
            <stop offset="100%" stopColor="#1a3d1a" />
          </linearGradient>
        </defs>

        {/* Fairway rectangle — 140px-wide strip down the middle */}
        <rect x={cx - 70} y={0} width={140} height={H} fill="url(#fairwayGradient)" opacity={0.6} />

        {/* Vertical mow stripes for fairway texture */}
        {mowLines.map((x, i) => (
          <line key={i} x1={x} y1={0} x2={x} y2={H} stroke="rgba(82, 166, 95, 0.3)" strokeWidth={8} />
        ))}

        {/* Fairway edge lines */}
        <line x1={cx - 70} y1={0} x2={cx - 70} y2={H} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <line x1={cx + 70} y1={0} x2={cx + 70} y2={H} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />

        {/* Dispersion group — rotates as a whole, around center */}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 400ms cubic-bezier(0.33, 1, 0.68, 1)',
          }}
        >
          {/* Outer glow ellipse */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={glowRx}
            ry={glowRy}
            fill="rgba(64, 196, 211, 0.35)"
            stroke="rgba(64, 196, 211, 0.6)"
            strokeWidth={2}
            style={{ transition: 'rx 400ms cubic-bezier(0.33, 1, 0.68, 1), ry 400ms cubic-bezier(0.33, 1, 0.68, 1)' }}
          />
          {/* Main dispersion ellipse */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={mainRx}
            ry={mainRy}
            fill="rgba(27, 107, 107, 0.45)"
            stroke="#1B6B6B"
            strokeWidth={3}
            style={{ transition: 'rx 400ms cubic-bezier(0.33, 1, 0.68, 1), ry 400ms cubic-bezier(0.33, 1, 0.68, 1)' }}
          />
          {/* Center dot — copper */}
          <ellipse cx={cx} cy={cy} rx={4} ry={4} fill="#B87333" />
        </g>

        {/* Axis indicators (unrotated, like RN) */}
        <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
        <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
      </svg>
    </div>
  );
}

// ============================================================================
// STEP 2 — About You: age group, years playing, frequency
// ============================================================================

function StepAboutYou({
  ageGroup, setAgeGroup, yearsPlaying, setYearsPlaying, playFrequency, setPlayFrequency,
}: {
  ageGroup: AgeGroup; setAgeGroup: (v: AgeGroup) => void;
  yearsPlaying: number; setYearsPlaying: (v: number) => void;
  playFrequency: PlayFreq; setPlayFrequency: (v: PlayFreq) => void;
}) {
  return (
    <div>
      <SectionHeader title="A bit about you" subtitle="Helps us calibrate recommendations to your experience." />

      <label className="block text-sm font-medium text-text-primary mb-2">Age group</label>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {AGE_GROUPS.map((g) => (
          <Choice key={g} value={g} current={ageGroup} onClick={setAgeGroup}>{g}</Choice>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-text-primary">Years playing</label>
        <span className="text-sm font-semibold text-primary">{yearsPlaying} {yearsPlaying === 1 ? 'year' : 'years'}</span>
      </div>
      <input
        type="range"
        min={0}
        max={50}
        step={1}
        value={yearsPlaying}
        onChange={(e) => setYearsPlaying(Number(e.target.value))}
        className="w-full accent-primary mb-1"
      />
      <div className="flex justify-between text-xs text-text-muted mb-6">
        <span>0</span><span>25</span><span>50</span>
      </div>

      <label className="block text-sm font-medium text-text-primary mb-2">How often do you play?</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLAY_FREQUENCIES.map((f) => {
          const active = playFrequency === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setPlayFrequency(f.value)}
              aria-pressed={active}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                active
                  ? 'border-primary bg-primary/10'
                  : 'border-secondary-700 hover:border-secondary-600'
              }`}
            >
              <div className={`font-medium ${active ? 'text-primary' : 'text-text-primary'}`}>{f.label}</div>
              <div className="text-xs text-text-muted">{f.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3 — Shot Shape: natural shape, height, curve magnitude (with trajectory viz)
// ============================================================================

function StepShotShape({
  naturalShot, setNaturalShot, shotHeight, setShotHeight, yardsOfCurve5i, setYardsOfCurve5i, dominantHand,
}: {
  naturalShot: ShotShape; setNaturalShot: (v: ShotShape) => void;
  shotHeight: ShotHeight; setShotHeight: (v: ShotHeight) => void;
  yardsOfCurve5i: number; setYardsOfCurve5i: (v: number) => void;
  dominantHand: Hand;
}) {
  return (
    <div>
      <SectionHeader title="Your natural shot" subtitle="Tell us about your typical ball flight." />

      <CurvedLineDemo shape={naturalShot} curve={yardsOfCurve5i} dominantHand={dominantHand} />

      <label className="block text-sm font-medium text-text-primary mb-2 mt-6">Shot shape</label>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['Draw', 'Straight', 'Fade'] as ShotShape[]).map((s) => (
          <Choice key={s} value={s} current={naturalShot} onClick={setNaturalShot}>{s}</Choice>
        ))}
      </div>

      <label className="block text-sm font-medium text-text-primary mb-2">Shot height</label>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['Low', 'Medium', 'High'] as ShotHeight[]).map((s) => (
          <Choice key={s} value={s} current={shotHeight} onClick={setShotHeight}>{s}</Choice>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-text-primary">Yards of curve with 5-iron</label>
        <span className="text-sm font-semibold text-primary">{yardsOfCurve5i} yards</span>
      </div>
      <input
        type="range"
        min={0}
        max={20}
        step={1}
        value={yardsOfCurve5i}
        onChange={(e) => setYardsOfCurve5i(Number(e.target.value))}
        className="w-full accent-primary"
        disabled={naturalShot === 'Straight'}
      />
      <div className="flex justify-between text-xs text-text-muted mt-1">
        <span>0</span>
        <span>10</span>
        <span>20</span>
      </div>
      <div className="mt-4 rounded-lg border border-secondary-700 bg-background/40 p-3 text-sm text-text-muted">
        💡 We automatically adjust for your curve on every club — more for driver, less for wedges.
      </div>
    </div>
  );
}

// CurvedLineDemo — port of CaddyAI_rn-main/src/components/Onboarding/CurvedLineDemo.tsx
// Ball at bottom-center, target at top-center, curve direction from shape+hand.
function CurvedLineDemo({
  shape, curve, dominantHand,
}: { shape: ShotShape; curve: number; dominantHand: Hand }) {
  const W = 300;
  const H = 200;
  const startX = W * 0.5;
  const startY = H * 0.85;
  const endX = W * 0.5;
  const endY = H * 0.15;
  const midY = H * 0.5;

  // From RN CurvedLineDemo.tsx:41-50
  const isRightHanded = dominantHand === 'Right';
  const direction =
    shape === 'Straight' ? 0 :
    shape === 'Draw' ? (isRightHanded ? 1 : -1) :
    /* Fade */         (isRightHanded ? -1 : 1);

  const normalizedCurve = Math.min(20, Math.max(0, curve)) / 20;
  const maxOffset = W * 0.25;
  const offset = direction * normalizedCurve * maxOffset;

  const controlX = startX + offset;
  const pathD = `M ${startX} ${startY} Q ${controlX} ${midY} ${endX} ${endY}`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-secondary-700" style={{ background: '#87CEEB' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 sm:h-52 block">
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="70%" stopColor="#98D8E8" />
            <stop offset="100%" stopColor="#7BC775" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect x={0} y={0} width={W} height={H} fill="url(#skyGradient)" />

        {/* Ground */}
        <path
          d={`M 0 ${H * 0.75} Q ${W * 0.5} ${H * 0.7} ${W} ${H * 0.75} L ${W} ${H} L 0 ${H} Z`}
          fill="#52A65F"
          opacity={0.5}
        />

        {/* Straight reference line */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={1}
          strokeDasharray="5 5"
        />

        {/* Curved flight path */}
        <path
          d={pathD}
          stroke="#ffffff"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />

        {/* Ball at start */}
        <circle cx={startX} cy={startY} r={8} fill="#ffffff" stroke="#cccccc" strokeWidth={1} />

        {/* Landing target — copper, layered */}
        <circle cx={endX} cy={endY} r={12} fill="rgba(184, 115, 51, 0.3)" stroke="#B87333" strokeWidth={2} />
        <circle cx={endX} cy={endY} r={4} fill="#B87333" />
      </svg>
    </div>
  );
}

// ============================================================================
// STEP 4 — Clubs: animated preview of the 14 clubs being seeded
// ============================================================================

function StepClubs({ handicap, naturalShot }: { handicap: number; naturalShot: ShotShape }) {
  const clubs = useMemo(() => {
    const face = naturalShot === 'Draw' ? 'Draw' : naturalShot === 'Fade' ? 'Fade' : 'Square';
    return generateDefaultClubs(handicap, face).slice(0, 14);
  }, [handicap, naturalShot]);

  return (
    <div>
      <SectionHeader
        title="Your bag is ready"
        subtitle="We've seeded 14 standard clubs calibrated to your handicap. Tweak any of them later from the Clubs page."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {clubs.map((c, idx) => (
          <div
            key={c.id}
            className="rounded-lg border border-secondary-700 bg-background/40 px-3 py-2.5 flex items-center justify-between"
            style={{
              animation: `clubFadeIn 280ms ease-out both`,
              animationDelay: `${idx * 35}ms`,
            }}
          >
            <div>
              <div className="text-sm font-semibold text-text-primary">{c.name}</div>
              <div className="text-[10px] uppercase tracking-wide text-text-muted">{c.category}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-primary">{c.totalYards}y</div>
              <div className="text-[10px] text-text-muted">{c.carryYards} carry</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-text-primary">
        <div className="font-medium text-primary mb-1">Tip</div>
        Distances come from a baseline that matches your handicap. As you log shots, the AI caddie refines them — what you see here is the starting point, not your final bag.
      </div>

      <style jsx global>{`
        @keyframes clubFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// STEP 5 — AI Caddie: skill level (auto-suggested) + verbosity with live preview
// ============================================================================

function StepAICaddie({
  handicap, skillLevel, setSkillLevel, skillUserEdited, verbosity, setVerbosity,
}: {
  handicap: number;
  skillLevel: SkillLevel; setSkillLevel: (v: SkillLevel) => void;
  skillUserEdited: boolean;
  verbosity: Verbosity; setVerbosity: (v: Verbosity) => void;
}) {
  const suggested = suggestSkillLevel(handicap);
  const sample = VERBOSITY_OPTIONS.find((v) => v.value === verbosity)!.sample;

  return (
    <div>
      <SectionHeader title="Your AI caddie" subtitle="How sharp does it think — and how chatty should it be?" />

      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary">Skill level</label>
        {!skillUserEdited && (
          <span className="text-xs text-text-muted">Auto-set from your handicap of {handicap} → <span className="text-primary font-medium">{suggested}</span></span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {SKILL_OPTIONS.map((s) => {
          const active = skillLevel === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSkillLevel(s.value)}
              aria-pressed={active}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                active
                  ? 'border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/40'
                  : 'border-secondary-700 hover:border-secondary-600'
              }`}
            >
              <div className={`text-sm font-semibold ${active ? 'text-blue-400' : 'text-text-primary'}`}>{s.label}</div>
              <div className="text-[10px] text-text-muted mt-0.5">{s.handicapRange}</div>
            </button>
          );
        })}
      </div>

      <label className="block text-sm font-medium text-text-primary mb-2">Verbosity</label>
      <div className="grid grid-cols-1 gap-3 mb-4">
        {VERBOSITY_OPTIONS.map((v) => {
          const active = verbosity === v.value;
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => setVerbosity(v.value)}
              aria-pressed={active}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                active
                  ? 'border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/40'
                  : 'border-secondary-700 hover:border-secondary-600'
              }`}
            >
              <div className={`font-semibold ${active ? 'text-blue-400' : 'text-text-primary'}`}>{v.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{v.description}</div>
            </button>
          );
        })}
      </div>

      <CaddiePreview sample={sample} />
    </div>
  );
}

function CaddiePreview({ sample }: { sample: string }) {
  return (
    <div className="rounded-lg border border-secondary-700 bg-background/40 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
          AI
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wide text-text-muted mb-1">Live preview · how your caddie sounds</div>
          <div key={sample} className="text-sm text-text-primary leading-relaxed">
            {sample}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 6 — Target Overlay: precise target dot vs probability ellipse
// ============================================================================

function StepTargetOverlay({
  targetOverlayMode, setTargetOverlayMode,
}: {
  targetOverlayMode: TargetMode; setTargetOverlayMode: (v: TargetMode) => void;
  handicap: number;
}) {
  return (
    <div>
      <SectionHeader
        title="How you want to see your target"
        subtitle="On the hole map, this is what you'll see overlaid on the green and fairway."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OverlayCard
          mode="target"
          active={targetOverlayMode === 'target'}
          onClick={() => setTargetOverlayMode('target')}
        />
        <OverlayCard
          mode="ellipse"
          active={targetOverlayMode === 'ellipse'}
          onClick={() => setTargetOverlayMode('ellipse')}
        />
      </div>

      <div className="mt-5 rounded-lg border border-secondary-700 bg-background/40 p-4 text-sm">
        {targetOverlayMode === 'target' ? (
          <>
            <div className="font-semibold text-text-primary mb-1">Target mode</div>
            <p className="text-text-muted">A single aim point. Cleanest view — best when you trust your dispersion already and just want a number to aim at.</p>
          </>
        ) : (
          <>
            <div className="font-semibold text-text-primary mb-1">Ellipse mode</div>
            <p className="text-text-muted">Shows where your shots actually tend to land — sized by your handicap. Best when you want to see hazards relative to your real dispersion, not a fictional perfect strike.</p>
          </>
        )}
      </div>
    </div>
  );
}

function OverlayCard({
  mode, active, onClick,
}: { mode: TargetMode; active: boolean; onClick: () => void }) {
  const isTarget = mode === 'target';
  const src = isTarget ? '/onboarding/overlay-target.png' : '/onboarding/overlay-ellipse.png';
  const label = isTarget ? 'Target' : 'Ellipse';
  const sublabel = isTarget ? 'Single precise aim point' : 'Where your shots actually land';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative rounded-lg border-2 overflow-hidden text-left transition-all ${
        active
          ? 'border-blue-500 ring-4 ring-blue-500/40'
          : 'border-secondary-700 hover:border-secondary-600'
      }`}
    >
      {/* Phone-screenshot preview */}
      <div className="bg-black flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${label} overlay preview from the mobile app`}
          className="w-full h-64 sm:h-72 object-contain"
          loading="lazy"
        />
      </div>
      <div className={`px-4 py-3 ${active ? 'bg-blue-500/10' : 'bg-black/40'}`}>
        <div className={`font-semibold ${active ? 'text-blue-400' : 'text-text-primary'}`}>{label}</div>
        <div className="text-xs text-text-muted">{sublabel}</div>
      </div>
      {active && (
        <div className="absolute top-2 right-2 rounded-full bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-lg">
          SELECTED
        </div>
      )}
    </button>
  );
}

// ============================================================================
// STEP 7 — Review
// ============================================================================

function StepReview({ values }: { values: any }) {
  const v = values;
  const verbosityLabel = VERBOSITY_OPTIONS.find((o) => o.value === v.verbosity)?.label ?? '—';
  const freqLabel = PLAY_FREQUENCIES.find((o) => o.value === v.playFrequency)?.label ?? '—';

  const rows: [string, string | number][] = [
    ['Name', v.playerName || '—'],
    ['Dominant hand', v.dominantHand],
    ['Handicap', v.handicap],
    ['Age group', v.ageGroup],
    ['Years playing', v.yearsPlaying],
    ['Frequency', freqLabel],
    ['Skill level', v.skillLevel],
    ['Shot shape', v.naturalShot],
    ['Shot height', v.shotHeight],
    ['5i curve', `${v.yardsOfCurve5i} yds`],
    ['Caddie verbosity', verbosityLabel],
    ['Target overlay', v.targetOverlayMode === 'target' ? 'Target' : 'Ellipse'],
  ];

  return (
    <div>
      <SectionHeader title="Review your setup" subtitle="You can change any of this later from your profile." />
      <dl className="divide-y divide-secondary-700 border border-secondary-700 rounded-lg overflow-hidden">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-text-muted">{k}</dt>
            <dd className="text-text-primary font-medium">{String(val)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
