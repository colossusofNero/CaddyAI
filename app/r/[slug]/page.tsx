/**
 * Public group-scorecard recap page — /r/[slug]
 *
 * Every recap SMS / keepsake links here (copperlinegolf.com/r/{shareSlug}).
 * Public, no login: a server component reads the joint round by its shareSlug
 * with the Admin SDK (which bypasses the auth-scoped Firestore rules) and shows
 * the keepsake image plus a scorecard summary. This is also the URL TCR opens
 * when reviewing the A2P campaign, so it must resolve with no login.
 */

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { initializeFirebaseAdmin } from '@/services/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface JointPlayer {
  slot: number;
  type: 'cardholder' | 'partner' | 'guest';
  displayName: string;
  scores: (number | null)[];
}

interface JointRound {
  courseName: string;
  teeBoxName?: string;
  shareSlug: string;
  keepsakeStorageUrl?: string | null;
  startedAt?: { toDate?: () => Date } | null;
  players: JointPlayer[];
}

async function getRoundBySlug(slug: string): Promise<JointRound | null> {
  try {
    const { db } = initializeFirebaseAdmin();
    const snap = await db
      .collection('jointRounds')
      .where('shareSlug', '==', slug)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data() as JointRound;
  } catch {
    return null;
  }
}

function total(scores: (number | null)[]): number {
  return (scores ?? []).reduce<number>((s, v) => s + (v ?? 0), 0);
}

function dateLabel(round: JointRound): string {
  try {
    const d = round.startedAt?.toDate?.();
    return d
      ? d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
  } catch {
    return '';
  }
}

export default async function RecapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const round = await getRoundBySlug(slug);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-32 pb-20 lg:pt-40 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {!round ? (
            <div className="text-center">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                Scorecard not found
              </h1>
              <p className="text-text-secondary">
                This scorecard link is invalid or has expired.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                  <span className="text-sm font-semibold">
                    ⛳ Copperline Golf
                  </span>
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold text-text-primary mb-2">
                  {round.courseName}
                </h1>
                <p className="text-text-secondary">
                  {dateLabel(round)}
                  {round.teeBoxName ? ` · ${round.teeBoxName} tees` : ''}
                </p>
              </div>

              {/* Keepsake image (rendered when the scorekeeper generated one) */}
              {round.keepsakeStorageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={round.keepsakeStorageUrl}
                  alt={`Scorecard from ${round.courseName}`}
                  className="w-full rounded-2xl shadow-lg mb-8"
                />
              ) : null}

              {/* Scorecard summary */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  Final scores
                </h2>
                <div className="divide-y divide-gray-100">
                  {[...(round.players ?? [])]
                    .sort((a, b) => a.slot - b.slot)
                    .map((p) => (
                      <div
                        key={p.slot}
                        className="flex items-center justify-between py-3"
                      >
                        <span className="text-text-primary font-medium">
                          {p.displayName}
                          {p.type === 'cardholder' ? ' 👑' : ''}
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {total(p.scores) || '—'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <p className="text-center text-sm text-text-muted mt-8">
                Scored with Copperline Golf. Want your own AI caddie and shared
                scorecards?{' '}
                <Link href="/" className="text-primary hover:underline">
                  Get the app
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
