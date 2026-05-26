/**
 * About Page
 * Company story, mission, and team — localized.
 */

'use client';

import { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { StatsCounter } from '@/components/StatsCounter';
import { CTASection } from '@/components/CTASection';
import { motion } from 'framer-motion';
import { Target, Users, Zap, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { staggerContainer, staggerItem } from '@/lib/animations';

export default function AboutPage() {
  const t = useTranslations('marketing.about');

  const values = [
    { icon: Target, title: t('values.precisionTitle'), description: t('values.precisionDesc') },
    { icon: Users, title: t('values.communityTitle'), description: t('values.communityDesc') },
    { icon: Zap, title: t('values.innovationTitle'), description: t('values.innovationDesc') },
    { icon: Heart, title: t('values.passionTitle'), description: t('values.passionDesc') },
  ];

  useEffect(() => {
    document.title = t('meta.title');
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('meta.description'));
    }
  }, [t]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              className="text-xl text-text-secondary"
            >
              {t('hero.subtitle')}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-background-light to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-6">
              {t('mission.heading')}
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              {t('mission.body')}
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              {t('values.heading')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    {value.title}
                  </h3>
                  <p className="text-text-secondary">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StatsCounter
            stats={[
              { value: 50000, label: t('stats.activeUsers'), suffix: '+' },
              { value: 2000000, label: t('stats.shotsTracked'), suffix: '+' },
              { value: 2020, label: t('stats.founded') },
              { value: 98, label: t('stats.satisfaction'), suffix: '%' },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <CTASection />

      <Footer />
    </div>
  );
}
