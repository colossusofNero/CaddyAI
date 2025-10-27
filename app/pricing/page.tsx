/**
 * Pricing Page
 * Pricing tiers with comparison and toggle
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { PricingCard, PricingToggle, PricingTier } from '@/components/PricingCard';
import { motion } from 'framer-motion';
import { Check, HelpCircle } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import type { BillingPeriod } from '@/types/subscription';

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for casual golfers getting started',
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      'Basic club recommendations',
      'Up to 10 clubs in bag',
      'Manual distance entry',
      'Basic weather data',
      '5 rounds per month',
    ],
    cta: 'Get Started Free',
    ctaLink: '/signup',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For serious golfers who want the full experience',
    priceMonthly: 9.99,
    priceAnnual: 95.88,
    popular: true,
    features: [
      'AI-powered recommendations',
      'Unlimited clubs in bag',
      'Shot dispersion tracking',
      'Real-time weather & elevation',
      'Unlimited rounds',
      'Performance analytics',
      'Course database access',
      'Priority support',
    ],
    featureTooltips: {
      'AI-powered recommendations':
        'Advanced machine learning algorithms analyze your game to provide personalized club suggestions.',
      'Shot dispersion tracking':
        'Track how your shots spread for each club to improve consistency and course management.',
      'Performance analytics':
        'Detailed statistics and insights to help you identify and improve weak areas of your game.',
    },
    cta: 'Start Pro Trial',
    ctaLink: '/signup?plan=pro',
  },
  {
    id: 'tour',
    name: 'Tour',
    description: 'Everything a competitive golfer needs',
    priceMonthly: 19.99,
    priceAnnual: 191.88,
    features: [
      'Everything in Pro',
      'Advanced shot analytics',
      'Strokes gained analysis',
      'Video swing integration',
      'Tournament mode',
      'Custom club fitting data',
      'API access',
      'White-glove support',
    ],
    featureTooltips: {
      'Strokes gained analysis':
        'Benchmark your performance against PGA Tour averages to see where you gain or lose strokes.',
      'Tournament mode':
        'Special features for competitive play including live scoring and pressure statistics.',
      'Custom club fitting data':
        'Import data from professional club fittings for even more accurate recommendations.',
    },
    cta: 'Start Tour Trial',
    ctaLink: '/signup?plan=tour',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createCheckoutSession, subscription, getSubscriptionStatus, isLoading, error } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Fetch subscription status on mount if user is logged in
  useEffect(() => {
    if (user) {
      getSubscriptionStatus();
    }
  }, [user, getSubscriptionStatus]);

  // Handle subscription button click
  const handleSubscribe = async (planId: string) => {
    // Free plan - direct to signup
    if (planId === 'free') {
      router.push('/signup');
      return;
    }

    // Not logged in - redirect to signup with plan
    if (!user) {
      router.push(`/signup?plan=${planId}`);
      return;
    }

    // Already subscribed to this plan - go to settings
    if (subscription?.plan === planId && subscription?.hasActiveSubscription) {
      router.push('/settings/subscription');
      return;
    }

    // Create checkout session
    try {
      setLoadingPlan(planId);
      await createCheckoutSession({
        plan: planId as 'pro' | 'tour',
        billingPeriod: isAnnual ? 'annual' : 'monthly',
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      setLoadingPlan(null);
    }
  };

  // Get button text based on user state and subscription
  const getButtonText = (planId: string): string => {
    if (planId === 'free') {
      return 'Get Started Free';
    }

    if (!user) {
      return `Start ${planId === 'pro' ? 'Pro' : 'Tour'} Trial`;
    }

    if (subscription?.plan === planId && subscription?.hasActiveSubscription) {
      return 'Manage Subscription';
    }

    if (subscription?.plan && subscription?.hasActiveSubscription) {
      return 'Switch Plan';
    }

    return `Start ${planId === 'pro' ? 'Pro' : 'Tour'} Trial`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background-alt to-background" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1
              variants={staggerItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6"
            >
              Simple,{' '}
              <span className="text-primary">
                Transparent Pricing
              </span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-xl text-text-secondary max-w-3xl mx-auto mb-12"
            >
              Choose the plan that's right for your game. All plans include a
              14-day free trial with no credit card required.
            </motion.p>

            <motion.div variants={staggerItem}>
              <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-center">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <PricingCard
                key={tier.id}
                tier={{
                  ...tier,
                  cta: getButtonText(tier.id),
                }}
                isAnnual={isAnnual}
                index={index}
                onSubscribe={() => handleSubscribe(tier.id)}
                isLoading={loadingPlan === tier.id}
                isCurrentPlan={subscription?.plan === tier.id && subscription?.hasActiveSubscription}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-background-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-text-secondary">
              Have questions? We've got answers.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'Can I change plans later?',
                answer:
                  'Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the start of your next billing cycle.',
              },
              {
                question: 'Is there a free trial?',
                answer:
                  'All paid plans include a 14-day free trial. No credit card required to start your trial.',
              },
              {
                question: 'What payment methods do you accept?',
                answer:
                  'We accept all major credit cards, debit cards, and PayPal. Annual plans can also be paid via bank transfer.',
              },
              {
                question: 'Can I use CaddyAI on multiple devices?',
                answer:
                  'Yes! Your account syncs across all devices. Use CaddyAI on your phone during rounds and review stats on your tablet or computer later.',
              },
              {
                question: 'What happens to my data if I cancel?',
                answer:
                  'Your data is preserved for 90 days after cancellation. You can reactivate anytime and pick up where you left off.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-secondary-800/50 backdrop-blur-sm border border-secondary-700 rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-text-primary mb-2 flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  {faq.question}
                </h3>
                <p className="text-text-secondary ml-7">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            Still Have Questions?
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Our team is here to help you choose the right plan for your game.
          </p>
          <a
            href="mailto:support@caddyai.com"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-400 font-medium transition-colors"
          >
            Contact Sales →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
