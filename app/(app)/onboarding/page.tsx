'use client';

/**
 * Post-signup profile walkthrough.
 *
 * Mirrors the React Native app's ProfileOnboardingFlow (6 steps) and writes to
 * the three profile collections (`profiles`, `userProfiles`, `playerProfiles`)
 * plus the `users/{uid}.profileComplete` flag that the app gates on. Completing
 * this flow is what Firebase + the RN app consider a "complete" profile.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { useAuth } from '@/hooks/useAuth';
import { updateUserSetupFlags } from '@/services/authService';
import { initializeNewUser } from '@/services/initializationService';
import type { UserProfile } from '@/src/types/user';

type Hand = 'right' | 'left';
type ShotShape = 'draw' | 'straight' | 'fade';
type ShotHeight = 'low' | 'medium' | 'high';
type PlayFreq = 'weekly' | 'monthly' | 'occasionally' | 'rarely';
type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro' | 'Tour Pro';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dominantHand, setDominantHand] = useState<Hand>('right');
  const [playerName, setPlayerName] = useState('');
  const [yearsPlaying, setYearsPlaying] = useState<number | ''>('');
  const [playFrequency, setPlayFrequency] = useState<PlayFreq>('monthly');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate');
  const [naturalShot, setNaturalShot] = useState<ShotShape>('straight');
  const [shotHeight, setShotHeight] = useState<ShotHeight>('medium');
  const [handicap, setHandicap] = useState<number>(18);
  const [yardsOfCurve5i, setYardsOfCurve5i] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const progress = useMemo(() => Math.round(((step + 1) / TOTAL_STEPS) * 100), [step]);

  const canAdvance = useMemo(() => {
    if (step === 4) return Number.isFinite(handicap) && handicap >= -12 && handicap <= 54;
    return true;
  }, [step, handicap]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setError(null);

      const db = getFirestore(getApps()[0]);
      const now = Date.now();
      const nowIso = new Date().toISOString();

      const webProfile: any = {
        userId: user.uid,
        dominantHand,
        handicap,
        typicalShotShape: naturalShot,
        curveTendency: Math.max(-10, Math.min(10, Math.round(yardsOfCurve5i / 2))),
        height: 70,
        playFrequency,
        skillLevel,
        updatedAt: now,
      };
      if (playerName.trim()) webProfile.playerName = playerName.trim();
      if (yearsPlaying !== '') webProfile.yearsPlaying = yearsPlaying;

      // Only write the fields the RN app declares required for a "complete"
      // profile. Extra optional fields with unexpected types can crash the
      // mobile app on load, so we keep this write minimal.
      const playerProfile: any = {
        userId: user.uid,
        dominantHand: dominantHand === 'right' ? 'Right' : 'Left',
        handicap,
        naturalShot: naturalShot.charAt(0).toUpperCase() + naturalShot.slice(1),
        shotHeight: shotHeight.charAt(0).toUpperCase() + shotHeight.slice(1),
        yardsOfCurve5i,
        updatedAt: nowIso,
      };
      if (playerName.trim()) playerProfile.playerName = playerName.trim();

      const existingProfile = await getDoc(doc(db, 'profiles', user.uid));
      const isNew = !existingProfile.exists();
      if (isNew) webProfile.createdAt = now;
      if (isNew) playerProfile.createdAt = nowIso;

      await Promise.all([
        setDoc(doc(db, 'profiles', user.uid), webProfile, { merge: true }),
        setDoc(doc(db, 'userProfiles', user.uid), webProfile, { merge: true }),
        setDoc(doc(db, 'playerProfiles', user.uid), playerProfile, { merge: true }),
      ]);

      if (isNew) {
        await initializeNewUser(user.uid, webProfile as UserProfile);
      }

      await updateUserSetupFlags(user.uid, { profileComplete: true, onboardingComplete: true });

      router.replace('/dashboard');
    } catch (err) {
      console.error('[Onboarding] Save failed:', err);
      setError('Could not save your profile. Please try again.');
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-text-muted mb-2">
            <span>Step {step + 1} of {TOTAL_STEPS}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-secondary-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-secondary rounded-xl p-6 sm:p-8 border border-secondary-700">
          {step === 0 && (
            <StepIntro playerName={playerName} setPlayerName={setPlayerName} dominantHand={dominantHand} setDominantHand={setDominantHand} />
          )}
          {step === 1 && (
            <StepExperience yearsPlaying={yearsPlaying} setYearsPlaying={setYearsPlaying} playFrequency={playFrequency} setPlayFrequency={setPlayFrequency} />
          )}
          {step === 2 && (
            <StepSkill skillLevel={skillLevel} setSkillLevel={setSkillLevel} />
          )}
          {step === 3 && (
            <StepShotShape naturalShot={naturalShot} setNaturalShot={setNaturalShot} shotHeight={shotHeight} setShotHeight={setShotHeight} />
          )}
          {step === 4 && (
            <StepHandicap handicap={handicap} setHandicap={setHandicap} yardsOfCurve5i={yardsOfCurve5i} setYardsOfCurve5i={setYardsOfCurve5i} naturalShot={naturalShot} />
          )}
          {step === 5 && (
            <StepReview
              values={{ dominantHand, playerName, yearsPlaying, playFrequency, skillLevel, naturalShot, shotHeight, handicap, yardsOfCurve5i }}
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
            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance}
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
                {saving ? 'Saving...' : 'Finish Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="mt-2 text-text-muted">{subtitle}</p>}
    </div>
  );
}

function Choice<T extends string>({ value, current, onClick, children }: { value: T; current: T; onClick: (v: T) => void; children: React.ReactNode }) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      aria-pressed={active}
      className={`p-4 rounded-lg border-2 transition-all capitalize ${
        active
          ? 'border-primary bg-primary/10 text-primary font-medium'
          : 'border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600'
      }`}
    >
      {children}
    </button>
  );
}

function StepIntro({ playerName, setPlayerName, dominantHand, setDominantHand }: any) {
  return (
    <div>
      <SectionHeader title="Welcome to Copperline Golf" subtitle="A quick setup so your AI caddy can actually help you." />
      <label className="block text-sm font-medium text-text-primary mb-2">Your name (optional)</label>
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="e.g. Scott"
        className="w-full px-4 py-3 bg-background border border-secondary-700 rounded-lg text-text-primary mb-6"
      />
      <label className="block text-sm font-medium text-text-primary mb-2">Dominant hand</label>
      <div className="grid grid-cols-2 gap-3">
        <Choice value="right" current={dominantHand} onClick={setDominantHand}>Right</Choice>
        <Choice value="left" current={dominantHand} onClick={setDominantHand}>Left</Choice>
      </div>
    </div>
  );
}

function StepExperience({ yearsPlaying, setYearsPlaying, playFrequency, setPlayFrequency }: any) {
  return (
    <div>
      <SectionHeader title="Your experience" subtitle="Helps us calibrate recommendations." />
      <label className="block text-sm font-medium text-text-primary mb-2">Years playing (optional)</label>
      <input
        type="number"
        min={0}
        max={100}
        value={yearsPlaying}
        onChange={(e) => setYearsPlaying(e.target.value ? Number(e.target.value) : '')}
        className="w-full px-4 py-3 bg-background border border-secondary-700 rounded-lg text-text-primary mb-6"
      />
      <label className="block text-sm font-medium text-text-primary mb-2">How often do you play?</label>
      <div className="grid grid-cols-2 gap-3">
        {(['weekly', 'monthly', 'occasionally', 'rarely'] as PlayFreq[]).map((f) => (
          <Choice key={f} value={f} current={playFrequency} onClick={setPlayFrequency}>{f}</Choice>
        ))}
      </div>
    </div>
  );
}

function StepSkill({ skillLevel, setSkillLevel }: any) {
  return (
    <div>
      <SectionHeader title="Skill level" subtitle="Controls how detailed your AI caddy's questions and analysis get." />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(['Beginner', 'Intermediate', 'Advanced', 'Pro', 'Tour Pro'] as SkillLevel[]).map((l) => (
          <Choice key={l} value={l} current={skillLevel} onClick={setSkillLevel}>{l}</Choice>
        ))}
      </div>
    </div>
  );
}

function StepShotShape({ naturalShot, setNaturalShot, shotHeight, setShotHeight }: any) {
  return (
    <div>
      <SectionHeader title="Your natural ball flight" subtitle="Pick what your typical full shot looks like." />
      <label className="block text-sm font-medium text-text-primary mb-2">Shot shape</label>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['draw', 'straight', 'fade'] as ShotShape[]).map((s) => (
          <Choice key={s} value={s} current={naturalShot} onClick={setNaturalShot}>{s}</Choice>
        ))}
      </div>
      <label className="block text-sm font-medium text-text-primary mb-2">Shot height</label>
      <div className="grid grid-cols-3 gap-3">
        {(['low', 'medium', 'high'] as ShotHeight[]).map((s) => (
          <Choice key={s} value={s} current={shotHeight} onClick={setShotHeight}>{s}</Choice>
        ))}
      </div>
    </div>
  );
}

function StepHandicap({ handicap, setHandicap, yardsOfCurve5i, setYardsOfCurve5i, naturalShot }: any) {
  return (
    <div>
      <SectionHeader title="Handicap & curve" subtitle="These are the numbers that actually drive club selection." />
      <label className="block text-sm font-medium text-text-primary mb-2">Handicap (-12 to 54)</label>
      <input
        type="number"
        min={-12}
        max={54}
        value={handicap}
        onChange={(e) => setHandicap(Number(e.target.value))}
        className="w-full px-4 py-3 bg-background border border-secondary-700 rounded-lg text-text-primary mb-6"
      />
      <label className="block text-sm font-medium text-text-primary mb-2">
        Typical 5-iron curve: {yardsOfCurve5i > 0 ? `+${yardsOfCurve5i}` : yardsOfCurve5i} yards
      </label>
      <input
        type="range"
        min={-30}
        max={30}
        value={yardsOfCurve5i}
        onChange={(e) => setYardsOfCurve5i(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-text-muted mt-1">
        <span>Heavy draw (-30)</span>
        <span>Straight</span>
        <span>Heavy fade (+30)</span>
      </div>
      <p className="mt-3 text-xs text-text-muted italic">
        Based on your {naturalShot}, most players land between {naturalShot === 'draw' ? '-15 and -5' : naturalShot === 'fade' ? '+5 and +15' : '-5 and +5'}.
      </p>
    </div>
  );
}

function StepReview({ values }: { values: any }) {
  const rows: [string, string | number][] = [
    ['Name', values.playerName || '—'],
    ['Dominant hand', values.dominantHand],
    ['Handicap', values.handicap],
    ['Shot shape', values.naturalShot],
    ['Shot height', values.shotHeight],
    ['5i curve', `${values.yardsOfCurve5i > 0 ? '+' : ''}${values.yardsOfCurve5i} yds`],
    ['Skill level', values.skillLevel],
    ['Frequency', values.playFrequency],
    ['Years playing', values.yearsPlaying === '' ? '—' : values.yearsPlaying],
  ];
  return (
    <div>
      <SectionHeader title="Review your setup" subtitle="You can change any of this later from your profile." />
      <dl className="divide-y divide-secondary-700 border border-secondary-700 rounded-lg overflow-hidden">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-text-muted">{k}</dt>
            <dd className="text-text-primary font-medium capitalize">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
