/**
 * Features Page
 * Detailed showcase of Copperline Golf features — localized.
 */

'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { FeatureCard, FeatureGrid } from '@/components/FeatureCard';
import { CTASection } from '@/components/CTASection';
import { StatsCounter, defaultStats } from '@/components/StatsCounter';
import { AIClubSelectionModal } from '@/components/AIClubSelectionModal';
import { ShotPatternsModal } from '@/components/ShotPatternsModal';
import { WeatherModal } from '@/components/WeatherModal';
import { ElevationModal } from '@/components/ElevationModal';
import { PerformanceAnalyticsModal } from '@/components/PerformanceAnalyticsModal';
import { CoursesDatabaseModal } from '@/components/CoursesDatabaseModal';
import { motion } from 'framer-motion';
import {
  Target,
  Brain,
  Wind,
  Mountain,
  BarChart3,
  Cloud,
  Smartphone,
  Zap,
  Users,
  Trophy,
  Map,
  TrendingUp,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { staggerContainer, staggerItem } from '@/lib/animations';

export default function FeaturesPage() {
  const t = useTranslations('marketing.features');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isShotPatternsModalOpen, setIsShotPatternsModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isElevationModalOpen, setIsElevationModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      switch (hash) {
        case '#ai-selection': setIsAIModalOpen(true); break;
        case '#shot-patterns': setIsShotPatternsModalOpen(true); break;
        case '#weather': setIsWeatherModalOpen(true); break;
        case '#elevation': setIsElevationModalOpen(true); break;
        case '#analytics': setIsAnalyticsModalOpen(true); break;
        case '#courses': setIsCoursesModalOpen(true); break;
      }
    };
    checkHash();
    const timer = setTimeout(checkHash, 100);
    window.addEventListener('hashchange', checkHash);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      clearTimeout(timer);
    };
  }, []);

  const handleFeatureClick = (hash: string, setModalOpen: (open: boolean) => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    setModalOpen(true);
    window.location.hash = hash;
  };

  const coreFeatures = [
    { icon: Brain, title: t('core.aiTitle'), description: t('core.aiDesc'), href: '#ai-selection', onClick: handleFeatureClick('ai-selection', setIsAIModalOpen) },
    { icon: Target, title: t('core.patternsTitle'), description: t('core.patternsDesc'), href: '#shot-patterns', onClick: handleFeatureClick('shot-patterns', setIsShotPatternsModalOpen) },
    { icon: Wind, title: t('core.weatherTitle'), description: t('core.weatherDesc'), href: '#weather', onClick: handleFeatureClick('weather', setIsWeatherModalOpen) },
    { icon: Mountain, title: t('core.elevationTitle'), description: t('core.elevationDesc'), href: '#elevation', onClick: handleFeatureClick('elevation', setIsElevationModalOpen) },
    { icon: BarChart3, title: t('core.analyticsTitle'), description: t('core.analyticsDesc'), href: '#analytics', onClick: handleFeatureClick('analytics', setIsAnalyticsModalOpen) },
    { icon: Map, title: t('core.coursesTitle'), description: t('core.coursesDesc'), href: '#courses', onClick: handleFeatureClick('courses', setIsCoursesModalOpen) },
  ];

  const advancedFeatures = [
    { icon: Smartphone, title: t('advanced.mobileTitle'), description: t('advanced.mobileDesc') },
    { icon: Cloud, title: t('advanced.cloudTitle'), description: t('advanced.cloudDesc') },
    { icon: Zap, title: t('advanced.instantTitle'), description: t('advanced.instantDesc') },
    { icon: Users, title: t('advanced.socialTitle'), description: t('advanced.socialDesc') },
    { icon: Trophy, title: t('advanced.handicapTitle'), description: t('advanced.handicapDesc') },
    { icon: TrendingUp, title: t('advanced.insightsTitle'), description: t('advanced.insightsDesc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background-light to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={staggerItem} className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('hero.badge')}</span>
            </motion.div>

            <motion.h1 variants={staggerItem} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              {t('hero.titleStart')}{' '}
              <span className="text-primary">{t('hero.titleHighlight')}</span>
            </motion.h1>

            <motion.p variants={staggerItem} className="text-xl text-text-secondary max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              {t('core.heading')}
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              {t('core.subheading')}
            </p>
          </div>

          <FeatureGrid columns={3}>
            {coreFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-background-light to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              {t('stats.heading')}
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              {t('stats.subheading')}
            </p>
          </div>

          <StatsCounter stats={defaultStats} />
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              {t('advanced.heading')}
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              {t('advanced.subheading')}
            </p>
          </div>

          <FeatureGrid columns={3}>
            {advancedFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-16 lg:py-24 bg-gradient-to-b from-background to-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
                <Smartphone className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{t('demo.badge')}</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                {t('demo.heading')}
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                {t('demo.subheading')}
              </p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-secondary-800 rounded-2xl p-6 md:p-10 border border-secondary-700">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="flex justify-center overflow-hidden">
                <iframe
                  src="https://appetize.io/embed/b_kw2eurfjmjgiqlrgz3lbgvlqwm?device=pixel7pro&osVersion=14.0&scale=60&centered=both"
                  width="100%"
                  height="1050"
                  frameBorder="0"
                  scrolling="no"
                  allow="camera;microphone;geolocation"
                  className="rounded-lg shadow-2xl w-full"
                  style={{ maxWidth: '500px' }}
                  title="Copperline Golf App Demo"
                />
              </div>

              <div className="bg-secondary-900 rounded-lg px-6 pb-6 pt-32 self-start">
                <h3 className="text-lg font-bold text-text-primary mb-4 mt-0">
                  {t('demo.instructionsTitle')}
                </h3>
                <ol className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
                    <span>{t('demo.step1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                    <span>{t('demo.step2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
                    <span><strong>{t('demo.step3Bold')}</strong> {t('demo.step3')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">4</span>
                    <span><strong>{t('demo.step4Bold')}</strong> {t('demo.step4')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">5</span>
                    <span>{t('demo.step5')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">6</span>
                    <span>{t('demo.step6')}</span>
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <CTASection />
      <Footer />

      <AIClubSelectionModal isOpen={isAIModalOpen} onClose={() => { setIsAIModalOpen(false); if (window.location.hash === '#ai-selection') history.pushState(null, '', window.location.pathname + window.location.search); }} />
      <ShotPatternsModal isOpen={isShotPatternsModalOpen} onClose={() => { setIsShotPatternsModalOpen(false); if (window.location.hash === '#shot-patterns') history.pushState(null, '', window.location.pathname + window.location.search); }} />
      <WeatherModal isOpen={isWeatherModalOpen} onClose={() => { setIsWeatherModalOpen(false); if (window.location.hash === '#weather') history.pushState(null, '', window.location.pathname + window.location.search); }} />
      <ElevationModal isOpen={isElevationModalOpen} onClose={() => { setIsElevationModalOpen(false); if (window.location.hash === '#elevation') history.pushState(null, '', window.location.pathname + window.location.search); }} />
      <PerformanceAnalyticsModal isOpen={isAnalyticsModalOpen} onClose={() => { setIsAnalyticsModalOpen(false); if (window.location.hash === '#analytics') history.pushState(null, '', window.location.pathname + window.location.search); }} />
      <CoursesDatabaseModal isOpen={isCoursesModalOpen} onClose={() => { setIsCoursesModalOpen(false); if (window.location.hash === '#courses') history.pushState(null, '', window.location.pathname + window.location.search); }} />
    </div>
  );
}
