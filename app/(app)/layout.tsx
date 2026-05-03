'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { firebaseService } from '@/services/firebaseService';
import { initializeNewUser } from '@/services/initializationService';
import { getUserMetadata } from '@/services/authService';
import type { UserProfile } from '@/src/types/user';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 10;

// Users created on/after this cutoff must complete the profile walkthrough
// before accessing the app. Older accounts see a dismissible reminder banner
// instead, so we don't disrupt existing users who signed up before the
// walkthrough existed.
const ONBOARDING_REQUIRED_AFTER = new Date('2026-04-15T00:00:00Z').getTime();
const BANNER_DISMISS_KEY = 'onboarding-banner-dismissed';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <AppGate>{children}</AppGate>
    </Suspense>
  );
}

function AppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading, getSubscriptionStatus } = useSubscription();
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [profileEnsured, setProfileEnsured] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ complete: boolean; isNewAccount: boolean } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const pollCount = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onOnboardingRoute = pathname === '/onboarding' || pathname?.startsWith('/onboarding/');

  const trialStarted = searchParams.get('trial_started') === 'true' || searchParams.get('promo_redeemed') === 'true';

  // Fetch subscription once user is available
  useEffect(() => {
    if (!user) return;

    getSubscriptionStatus().then(() => {
      setSubscriptionChecked(true);
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling logic when trial_started=true and no active subscription yet
  useEffect(() => {
    if (!subscriptionChecked) return;
    if (!user) return;
    if (subscription?.hasActiveSubscription) return;
    if (!trialStarted) return;
    if (pollCount.current >= MAX_POLL_ATTEMPTS) return;

    pollingRef.current = setTimeout(async () => {
      pollCount.current += 1;
      await getSubscriptionStatus();
      setSubscriptionChecked(true);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [subscriptionChecked, subscription, user, trialStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure a default profile exists so the app is functional.
  // QR code / promo users land here without having gone through onboarding.
  useEffect(() => {
    if (!user) return;
    if (profileEnsured) return;

    const ensureProfile = async () => {
      try {
        const db = getFirestore(getApps()[0]);
        const now = Date.now();

        // Check all three profile collections the mobile + web apps may read from
        const [profilesSnap, userProfilesSnap, playerProfilesSnap] = await Promise.all([
          getDoc(doc(db, 'profiles', user.uid)),
          getDoc(doc(db, 'userProfiles', user.uid)),
          getDoc(doc(db, 'playerProfiles', user.uid)),
        ]);

        const needsAnyProfile = !profilesSnap.exists() || !userProfilesSnap.exists() || !playerProfilesSnap.exists();

        if (needsAnyProfile) {
          console.log('[AppGate] Missing profile doc(s) — creating defaults for', user.uid);

          const defaults = {
            userId: user.uid,
            dominantHand: 'right',
            handicap: 18,
            typicalShotShape: 'straight',
            height: 70,
            curveTendency: 0,
            createdAt: now,
            updatedAt: now,
          };

          // Also build the PlayerProfile shape the mobile app expects
          const playerProfileDefaults = {
            userId: user.uid,
            dominantHand: 'Right',
            handicap: 18,
            naturalShot: 'Straight',
            shotHeight: 'Medium',
            yardsOfCurve5i: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Write to all collections in parallel — only those that are missing
          const writes: Promise<void>[] = [];
          if (!profilesSnap.exists()) {
            writes.push(setDoc(doc(db, 'profiles', user.uid), defaults));
          }
          if (!userProfilesSnap.exists()) {
            writes.push(setDoc(doc(db, 'userProfiles', user.uid), defaults));
          }
          if (!playerProfilesSnap.exists()) {
            writes.push(setDoc(doc(db, 'playerProfiles', user.uid), playerProfileDefaults));
          }
          await Promise.all(writes);

          // Initialize clubs/shots/preferences if this is a brand new user
          if (!profilesSnap.exists()) {
            await initializeNewUser(user.uid, defaults as UserProfile);
          }

          console.log('[AppGate] Default profile(s) + clubs/shots created');
        }
      } catch (err) {
        console.error('[AppGate] Failed to ensure profile:', err);
      } finally {
        setProfileEnsured(true);
      }
    };

    ensureProfile();
  }, [user, profileEnsured]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Hydrate banner-dismissed state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    setBannerDismissed(window.localStorage.getItem(`${BANNER_DISMISS_KEY}:${user.uid}`) === '1');
  }, [user]);

  // Load profileComplete + account age from users/{uid}.
  // Refetch on pathname change so the gate sees fresh flags after the
  // onboarding page writes profileComplete=true and navigates to /dashboard.
  // Reset to null first so the redirect effect below doesn't fire on stale
  // data while the new fetch is in flight.
  useEffect(() => {
    if (!user) return;
    if (!profileEnsured) return;
    setProfileStatus(null);
    let cancelled = false;
    (async () => {
      const meta = await getUserMetadata(user.uid);
      if (cancelled) return;
      const createdMs = meta?.createdAt ? new Date(meta.createdAt).getTime() : Date.now();
      setProfileStatus({
        complete: !!meta?.profileComplete,
        isNewAccount: Number.isFinite(createdMs) && createdMs >= ONBOARDING_REQUIRED_AFTER,
      });
    })();
    return () => { cancelled = true; };
  }, [user, profileEnsured, pathname]);

  // Hard-gate new accounts: redirect to onboarding until profileComplete
  useEffect(() => {
    if (!user || !profileStatus || onOnboardingRoute) return;
    if (profileStatus.isNewAccount && !profileStatus.complete) {
      router.replace('/onboarding');
    }
  }, [user, profileStatus, onOnboardingRoute, router]);

  const dismissBanner = () => {
    if (typeof window !== 'undefined' && user) {
      window.localStorage.setItem(`${BANNER_DISMISS_KEY}:${user.uid}`, '1');
    }
    setBannerDismissed(true);
  };

  const showLegacyBanner =
    !!profileStatus &&
    !profileStatus.complete &&
    !profileStatus.isNewAccount &&
    !bannerDismissed &&
    !onOnboardingRoute;

  // Subscription redirect (after exhausting polls or no trial_started)
  useEffect(() => {
    if (!subscriptionChecked) return;
    if (!user) return;
    if (subscription?.hasActiveSubscription) return;

    const exhaustedPolling = trialStarted && pollCount.current >= MAX_POLL_ATTEMPTS;
    const noPollingNeeded = !trialStarted;

    if (exhaustedPolling || noPollingNeeded) {
      router.replace('/start-trial');
    }
  }, [subscriptionChecked, subscription, user, trialStarted, router]);

  // Show spinner while auth is loading
  if (authLoading) return <Spinner />;

  // Show spinner while we wait for the user (pre-redirect)
  if (!user) return <Spinner />;

  // Show spinner while subscription is loading or not yet checked
  if (!subscriptionChecked || subLoading) return <Spinner />;

  // Show spinner while polling after trial_started
  if (trialStarted && !subscription?.hasActiveSubscription && pollCount.current < MAX_POLL_ATTEMPTS) {
    return <Spinner />;
  }

  // Active subscription — render app (with legacy reminder banner if applicable)
  if (subscription?.hasActiveSubscription) {
    return (
      <>
        {showLegacyBanner && (
          <div className="w-full bg-primary/10 border-b border-primary/40 text-text-primary">
            <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
              <span>
                Finish your golf profile so Copperline can give you accurate recommendations.{' '}
                <Link href="/onboarding" className="underline font-medium text-primary">Complete setup</Link>
              </span>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Dismiss"
                className="text-text-muted hover:text-text-primary px-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  // Redirecting — show spinner
  return <Spinner />;
}
