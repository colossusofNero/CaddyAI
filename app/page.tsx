/**
 * Homepage
 * CaddyAI landing page with hero, features, testimonials, and CTA
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { FeatureCard, FeatureGrid } from '@/components/redesign/FeatureCard';
import { TestimonialSlider } from '@/components/TestimonialSlider';
import { StatsCounter, defaultStats } from '@/components/StatsCounter';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';
import { SocialProofSection } from '@/components/redesign/SocialProofSection';
import { motion } from 'framer-motion';
import {
  Target,
  BarChart3,
  Cloud,
  Brain,
  TrendingUp,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Features per Design System - 3 core features
  const features = [
    {
      icon: Target,
      title: 'Smart Club Selection',
      description:
        'AI-powered recommendations based on your unique swing profile and real-time conditions. Get the right club for every shot.',
    },
    {
      icon: Brain,
      title: 'Personal Profile',
      description:
        'Track your clubs and distances with personalized insights for every club in your bag. Your game, optimized.',
    },
    {
      icon: Cloud,
      title: 'Real-time Conditions',
      description:
        'Live weather, wind, and elevation data for every shot. Make informed decisions based on actual conditions.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <Hero />

      {/* Social Proof Section - REDESIGNED */}
      <SocialProofSection />

      {/* Features Section - REDESIGNED */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4"
            >
              What Makes CaddyAI
              <br />
              Your Perfect Partner
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-body text-lg lg:text-xl text-neutral-700 max-w-3xl mx-auto"
            >
              Three core features that work together to transform your game
            </motion.p>
          </div>

          <FeatureGrid columns={3}>
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background via-background-light to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-5xl font-bold text-text-primary mb-4"
            >
              Trusted by Golfers <span className="text-primary">Worldwide</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg lg:text-xl text-text-secondary max-w-3xl mx-auto"
            >
              Join thousands of players who have improved their game with CaddyAI
            </motion.p>
          </div>

          <StatsCounter stats={defaultStats} />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-5xl font-bold text-text-primary mb-4"
            >
              Get Started in <span className="text-primary">3 Easy Steps</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '1',
                title: 'Create Your Profile',
                description:
                  'Answer a few quick questions about your game and add your club distances.',
              },
              {
                step: '2',
                title: 'Hit the Course',
                description:
                  'Open CaddyAI on your phone and let it track conditions automatically.',
              },
              {
                step: '3',
                title: 'Play Smarter',
                description:
                  'Receive instant, personalized club recommendations for every shot.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary">
                  <span className="text-3xl font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-text-secondary text-lg">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-background-light to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-5xl font-bold text-text-primary mb-4"
            >
              What Golfers Are <span className="text-primary">Saying</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg lg:text-xl text-text-secondary max-w-3xl mx-auto"
            >
              Real feedback from golfers who have transformed their game
            </motion.p>
          </div>

          <TestimonialSlider />
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      <Footer />
    </div>
  );
}
