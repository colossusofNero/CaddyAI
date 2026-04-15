'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { firebaseService } from '@/services/firebaseService';
import { initializeNewUser } from '@/services/initializationService';
import type { UserProfile } from '@/src/types/user';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 10;

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
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading, getSubscriptionStatus } = useSubscription();
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [profileEnsured, setProfileEnsured] = useState(false);
  const pollCount = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Active subscription — render app
  if (subscription?.hasActiveSubscription) {
    return <>{children}</>;
  }

  // Redirecting — show spinner
  return <Spinner />;
}
