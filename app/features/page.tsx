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
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

export default function FeaturesPage() {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Check for #ai-selection hash and open modal
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#ai-selection') {
        setIsAIModalOpen(true);
      }
    };

    // Check on mount
    checkHash();

    // Listen for hash changes
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleAIFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAIModalOpen(true);
    window.location.hash = 'ai-selection';
  };

  const coreFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Club Selection',
      description:
        'Our advanced AI analyzes distance, wind, elevation, and your personal shot history to recommend the perfect club for every situation.',
      href: '#ai-selection',
      onClick: handleAIFeatureClick,
    },
    {
      icon: Target,
      title: 'Personalized Shot Patterns',
      description:
        'Track your shot dispersion patterns for each club. CaddyAI learns your tendencies and adjusts recommendations accordingly.',
      href: '#shot-patterns',
    },
    {
      icon: Wind,
      title: 'Real-Time Weather Integration',
      description:
        'Automatic weather data fetching provides wind speed, direction, and temperature to adjust your club selection in real-time.',
      href: '#weather',
    },
    {
      icon: Mountain,
      title: 'Elevation Adjustments',
      description:
        'Precise elevation calculations help you account for uphill and downhill shots, ensuring accurate distance recommendations.',
      href: '#elevation',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description:
        'Detailed statistics and insights about your game help you identify strengths, weaknesses, and areas for improvement.',
      href: '#analytics',
    },
    {
      icon: Map,
      title: '15,000+ Course Database',
      description:
        'Access detailed course information, GPS coordinates, and hole layouts for thousands of courses worldwide.',
      href: '#courses',
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

      {/* AI Club Selection Modal */}
      <AIClubSelectionModal
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          // Remove hash when closing
          if (window.location.hash === '#ai-selection') {
            history.pushState('', document.title, window.location.pathname + window.location.search);
          }
        }}
      />
    </div>
  );
}
