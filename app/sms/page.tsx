/**
 * SMS Program Page (public, no login) — /sms
 *
 * This is the publicly verifiable "Call to Action / Message Flow" URL required
 * for A2P 10DLC (TCR) campaign approval. It documents the Copperline Golf
 * scorecard-recap SMS program and shows the exact consent language a player
 * agrees to in the app. Keep this page crawlable and reachable with NO login.
 */

'use client';

import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { MessageSquare, Check, ShieldCheck, Ban, HelpCircle } from 'lucide-react';

export default function SmsProgramPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-semibold">SMS Program</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6">
              Copperline Golf Scorecard Texts
            </h1>
            <p className="text-lg text-text-secondary mb-2">
              How our group-scorecard SMS program works and how you consent.
            </p>
            <p className="text-sm text-text-muted">Last Updated: July 7, 2026</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none"
          >
            <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-lg space-y-8">
              {/* What */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-primary" />
                  What messages we send
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  When you play a group round scored in the Copperline Golf app,
                  the group&apos;s official scorekeeper can text you your shared
                  scorecard once the round is finished. These are one-time,
                  transactional messages containing a link to your keepsake
                  scorecard. This is <strong>not</strong> a marketing or
                  recurring program.
                </p>
                <div className="bg-primary/5 rounded-xl p-6 mt-4">
                  <p className="text-sm text-text-muted mb-2 font-semibold">
                    Example message:
                  </p>
                  <p className="text-text-secondary italic">
                    &ldquo;Hey Jamie, here&apos;s your scorecard from Bear
                    Mountain Golf Course (Jul 6, 2026):
                    https://copperlinegolf.com/r/AB12CD&rdquo;
                  </p>
                </div>
              </div>

              {/* How you consent */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Check className="w-8 h-8 text-primary" />
                  How you opt in
                </h2>
                <div className="text-text-secondary leading-relaxed space-y-4">
                  <p>
                    Opt-in happens in person, in the Copperline Golf mobile app —
                    texting a keyword is not required to join. During or after a
                    group round, on the shared scorecard you (or the scorekeeper,
                    with your permission and your own phone number) tap
                    &ldquo;Add player,&rdquo; choose <strong>SMS</strong>, and
                    enter your mobile number. By entering your number and saving,
                    you agree to the consent statement:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <p className="text-text-secondary italic">
                      &ldquo;I agree to receive a one-time SMS from Copperline
                      Golf with my group scorecard at the phone number provided.
                      Message and data rates may apply. Message frequency is
                      about one message per round played. Reply STOP to
                      unsubscribe or HELP for help.&rdquo;
                    </p>
                  </div>
                  <p>
                    Your number is used only to deliver your scorecard. It is
                    never sold, rented, or shared with third parties for their
                    own marketing. Consent is recorded with a timestamp.
                  </p>
                </div>
              </div>

              {/* Frequency & rates */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                  Frequency, rates &amp; privacy
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                  <li>
                    <strong>Message frequency:</strong> approximately one message
                    per group round you play.
                  </li>
                  <li>
                    <strong>Cost:</strong> Message and data rates may apply,
                    depending on your mobile carrier and plan.
                  </li>
                  <li>
                    <strong>Privacy:</strong> We do not sell, rent, or share your
                    mobile number with any third party for their marketing. See
                    our{' '}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>
                    .
                  </li>
                </ul>
              </div>

              {/* Opt out */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <Ban className="w-8 h-8 text-primary" />
                  How to opt out (STOP)
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Reply <strong>STOP</strong> to any message to unsubscribe at
                  any time. You will receive one confirmation that you have been
                  unsubscribed, and no further messages will be sent. Reply{' '}
                  <strong>START</strong> to resubscribe.
                </p>
              </div>

              {/* Help */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <HelpCircle className="w-8 h-8 text-primary" />
                  Get help (HELP)
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  Reply <strong>HELP</strong> to any message, or contact us at{' '}
                  <a
                    href="mailto:support@copperlinegolf.com"
                    className="text-primary hover:underline"
                  >
                    support@copperlinegolf.com
                  </a>
                  . Copperline Golf, Inc., Scottsdale, AZ 85260.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
