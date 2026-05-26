/**
 * Pricing Page
 * Pricing tiers with comparison and toggle — localized.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { PricingCard, PricingToggle, PricingTier } from '@/components/PricingCard';
import { motion } from 'framer-motion';
import { Check, HelpCircle, RefreshCw, DollarSign, Database, Calendar as CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export default function PricingPage() {
  const router = useRouter();
  const t = useTranslations('marketing.pricing');
  const { user } = useAuth();
  const { createCheckoutSession, subscription, getSubscriptionStatus, isLoading: _isLoading, error } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Build localized tiers (memo would be nicer but t() is cheap)
  const pricingTiers: PricingTier[] = [
    {
      id: 'pro',
      name: t('proName'),
      description: t('proDesc'),
      priceMonthly: 9.95,
      priceAnnual: 79.60,
      popular: true,
      badge: t('proBadge'),
      features: [
        t('features.aiRecommendations'),
        t('features.unlimitedClubs'),
        t('features.shotDispersion'),
        t('features.weatherElevation'),
        t('features.unlimitedRounds'),
        t('features.performanceAnalytics'),
        t('features.courseDatabase'),
        t('features.prioritySupport'),
      ],
      featureTooltips: {
        [t('features.aiRecommendations')]: t('tooltips.aiRecommendations'),
        [t('features.shotDispersion')]: t('tooltips.shotDispersion'),
        [t('features.performanceAnalytics')]: t('tooltips.performanceAnalytics'),
      },
      cta: t('cta.startTrial'),
      ctaLink: '/signup?plan=pro',
    },
  ];

  useEffect(() => {
    document.title = t('meta.title');
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('meta.description'));
    }
  }, [t]);

  // Fetch subscription status on mount if user is logged in
  useEffect(() => {
    if (user) {
      getSubscriptionStatus();
    }
  }, [user, getSubscriptionStatus]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push(`/signup?plan=${planId}`);
      return;
    }

    if (subscription?.plan === planId && subscription?.hasActiveSubscription) {
      router.push('/settings/subscription');
      return;
    }

    try {
      setLoadingPlan(planId);
      await createCheckoutSession({
        plan: 'pro',
        billingPeriod: isAnnual ? 'annual' : 'monthly',
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      setLoadingPlan(null);
    }
  };

  const getButtonText = (planId: string): string => {
    if (!user) {
      return t('cta.startTrial');
    }
    if (subscription?.plan === planId && subscription?.hasActiveSubscription) {
      return t('cta.manage');
    }
    if (subscription?.plan && subscription?.hasActiveSubscription) {
      return t('cta.switchPlan');
    }
    return t('cta.startTrial');
  };

  const seasonalChecklist = [t('seasonal.check1'), t('seasonal.check2'), t('seasonal.check3'), t('seasonal.check4')];

  const seasonalBenefits = [
    { Icon: CalendarIcon, title: t('seasonal.benefit1Title'), desc: t('seasonal.benefit1Desc') },
    { Icon: DollarSign, title: t('seasonal.benefit2Title'), desc: t('seasonal.benefit2Desc') },
    { Icon: Database, title: t('seasonal.benefit3Title'), desc: t('seasonal.benefit3Desc') },
    { Icon: RefreshCw, title: t('seasonal.benefit4Title'), desc: t('seasonal.benefit4Desc') },
  ];

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
  ];

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
              {t('hero.titleStart')}{' '}
              <span className="text-primary">{t('hero.titleHighlight')}</span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-xl text-text-secondary max-w-3xl mx-auto mb-12"
            >
              {t('hero.subtitle')}
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
          <div className="max-w-lg mx-auto grid grid-cols-1 gap-8 pt-12">
            {pricingTiers.map((tier, index) => (
              <PricingCard
                key={tier.id}
                tier={{ ...tier, cta: getButtonText(tier.id) }}
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

      {/* Seasonal Golfer Savings */}
      <section className="py-16 lg:py-20 bg-secondary-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-secondary-800 border border-secondary-700 rounded-3xl p-8 lg:p-12"
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  {t('seasonal.badge')}
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  {t('seasonal.titleStart')}
                  <br />
                  <span className="text-primary">{t('seasonal.titleHighlight')}</span>
                </h2>
                <p className="text-lg text-gray-300 mb-6">{t('seasonal.body')}</p>
                <ul className="space-y-3 mb-6">
                  {seasonalChecklist.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-secondary-700 border border-secondary-600 rounded-xl p-6">
                  <div className="text-sm text-gray-400 mb-2">{t('seasonal.savingsLabel')}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">$79.60</span>
                    <span className="text-gray-300">{t('seasonal.savingsMonths')}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">{t('seasonal.vsLine')}</div>
                  <div className="text-lg font-bold text-primary mt-3">{t('seasonal.savingsTotal')}</div>
                </div>
              </div>
              <div className="bg-secondary-700 border border-secondary-600 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  {t('seasonal.benefitsHeading')}
                </h3>
                <div className="space-y-5">
                  {seasonalBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <benefit.Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{benefit.title}</h4>
                        <p className="text-sm text-gray-300">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-secondary-800 border border-secondary-600 rounded-xl text-center">
                  <p className="text-sm text-gray-300 mb-1">{t('seasonal.platforms')}</p>
                  <p className="text-xs text-gray-400">{t('seasonal.cancelAnytime')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-background-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              {t('faq.heading')}
            </h2>
            <p className="text-lg text-text-secondary">{t('faq.subheading')}</p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
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
            {t('contactSales.heading')}
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            {t('contactSales.body')}
          </p>
          <a
            href="mailto:support@copperlinegolf.com"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-400 font-medium transition-colors"
          >
            {t('contactSales.cta')}
          </a>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-lg border-t border-secondary-700 shadow-lg">
        <button
          onClick={() => handleSubscribe('pro')}
          disabled={loadingPlan === 'pro'}
          className="w-full py-4 px-6 bg-primary hover:bg-primary-600 disabled:opacity-60 text-secondary-900 font-bold text-lg rounded-xl transition-colors touch-manipulation"
        >
          {loadingPlan === 'pro' ? t('stickyCta.loading') : t('stickyCta.cta')}
        </button>
        <p className="text-center text-xs text-text-muted mt-2">
          {t('stickyCta.subtitle')}
        </p>
      </div>

      {/* Spacer so sticky bar doesn't cover footer on mobile */}
      <div className="lg:hidden h-28" />

      <Footer />
    </div>
  );
}
