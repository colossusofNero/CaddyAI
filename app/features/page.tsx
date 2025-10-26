/**
 * Features Page
 * Detailed showcase of CaddyAI features
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
import { staggerContainer, staggerItem } from '@/lib/animations';

export default function FeaturesPage() {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isShotPatternsModalOpen, setIsShotPatternsModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isElevationModalOpen, setIsElevationModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);

  // Check for hash navigation and open appropriate modal
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      console.log('[Features] Checking hash:', hash);

      switch (hash) {
        case '#ai-selection':
          setIsAIModalOpen(true);
          break;
        case '#shot-patterns':
          setIsShotPatternsModalOpen(true);
          break;
        case '#weather':
          setIsWeatherModalOpen(true);
          break;
        case '#elevation':
          setIsElevationModalOpen(true);
          break;
        case '#analytics':
          setIsAnalyticsModalOpen(true);
          break;
        case '#courses':
          setIsCoursesModalOpen(true);
          break;
      }
    };

    // Check on mount with a small delay to ensure hash is available
    checkHash();

    // Also check after a brief delay for client-side navigation
    const timer = setTimeout(checkHash, 100);

    // Listen for hash changes
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
    {
      icon: Brain,
      title: 'AI-Powered Club Selection',
      description:
        'Our advanced AI analyzes distance, wind, elevation, and your personal shot history to recommend the perfect club for every situation.',
      href: '#ai-selection',
      onClick: handleFeatureClick('ai-selection', setIsAIModalOpen),
    },
    {
      icon: Target,
      title: 'Personalized Shot Patterns',
      description:
        'Track your shot dispersion patterns for each club. CaddyAI learns your tendencies and adjusts recommendations accordingly.',
      href: '#shot-patterns',
      onClick: handleFeatureClick('shot-patterns', setIsShotPatternsModalOpen),
    },
    {
      icon: Wind,
      title: 'Real-Time Weather Integration',
      description:
        'Automatic weather data fetching provides wind speed, direction, and temperature to adjust your club selection in real-time.',
      href: '#weather',
      onClick: handleFeatureClick('weather', setIsWeatherModalOpen),
    },
    {
      icon: Mountain,
      title: 'Elevation Adjustments',
      description:
        'Precise elevation calculations help you account for uphill and downhill shots, ensuring accurate distance recommendations.',
      href: '#elevation',
      onClick: handleFeatureClick('elevation', setIsElevationModalOpen),
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description:
        'Detailed statistics and insights about your game help you identify strengths, weaknesses, and areas for improvement.',
      href: '#analytics',
      onClick: handleFeatureClick('analytics', setIsAnalyticsModalOpen),
    },
    {
      icon: Map,
      title: '15,000+ Course Database',
      description:
        'Access detailed course information, GPS coordinates, and hole layouts for thousands of courses worldwide.',
      href: '#courses',
      onClick: handleFeatureClick('courses', setIsCoursesModalOpen),
    },
  ];

  const advancedFeatures = [
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description:
        'Optimized for on-course use with quick access to recommendations and minimal battery drain.',
    },
    {
      icon: Cloud,
      title: 'Cloud Sync',
      description:
        'Your profile, clubs, and stats sync across all your devices automatically.',
    },
    {
      icon: Zap,
      title: 'Instant Recommendations',
      description:
        'Get club suggestions in milliseconds without slowing down your round.',
    },
    {
      icon: Users,
      title: 'Social Features',
      description:
        'Share rounds with friends, compare stats, and compete on leaderboards.',
    },
    {
      icon: Trophy,
      title: 'Handicap Tracking',
      description:
        'Monitor your handicap progress over time and see how CaddyAI helps you improve.',
    },
    {
      icon: TrendingUp,
      title: 'Improvement Insights',
      description:
        'Personalized tips and suggestions based on your performance trends.',
    },
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
            <motion.div
              variants={staggerItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Powered by Advanced AI
              </span>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6"
            >
              Everything You Need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-400">
                Play Smarter
              </span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-xl text-text-secondary max-w-3xl mx-auto"
            >
              CaddyAI combines artificial intelligence, real-time data, and
              personalized insights to help you make better decisions on every
              shot.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Core Features
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              The essential tools that make CaddyAI your perfect golf companion
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
              Trusted by Golfers Worldwide
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Join thousands of players improving their game with CaddyAI
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
              Advanced Capabilities
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Go beyond the basics with powerful features designed for serious
              golfers
            </p>
          </div>

          <FeatureGrid columns={3}>
            {advancedFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      <Footer />

      {/* Feature Modals */}
      <AIClubSelectionModal
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          if (window.location.hash === '#ai-selection') {
            history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      <ShotPatternsModal
        isOpen={isShotPatternsModalOpen}
        onClose={() => {
          setIsShotPatternsModalOpen(false);
          if (window.location.hash === '#shot-patterns') {
            history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => {
          setIsWeatherModalOpen(false);
          if (window.location.hash === '#weather') {
            history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      <ElevationModal
        isOpen={isElevationModalOpen}
        onClose={() => {
          setIsElevationModalOpen(false);
          if (window.location.hash === '#elevation') {
            history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      <PerformanceAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => {
          setIsAnalyticsModalOpen(false);
          if (window.location.hash === '#analytics') {
            history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      <CoursesDatabaseModal
        isOpen={isCoursesModalOpen}
        onClose={() => {
          setIsCoursesModalOpen(false);
          if (window.location.hash === '#courses') {
            history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />
    </div>
  );
}
