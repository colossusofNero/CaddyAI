/**
 * Homepage
 * Copperline Golf landing page with hero, features, testimonials, and CTA
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { FeatureCard, FeatureGrid } from '@/components/redesign/FeatureCard';
import { TestimonialSlider } from '@/components/TestimonialSlider';
import { StatsCounter, defaultStats } from '@/components/StatsCounter';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';
import { SocialProofSection } from '@/components/redesign/SocialProofSection';
import { CourseShowcase } from '@/components/CourseShowcase';
import { AIClubSelectionModal } from '@/components/AIClubSelectionModal';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import {
  Target,
  BarChart3,
  Cloud,
  Brain,
  TrendingUp,
  Zap,
  UserPlus,
  Map,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const t = useTranslations('marketing.home');

  // Features per Design System - 3 core features
  const features = [
    {
      icon: Target,
      title: t('features.smartClubTitle'),
      description: t('features.smartClubDesc'),
    },
    {
      icon: Brain,
      title: t('features.profileTitle'),
      description: t('features.profileDesc'),
    },
    {
      icon: Cloud,
      title: t('features.conditionsTitle'),
      description: t('features.conditionsDesc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation hideLogo={true} />

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
              className="font-sans text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4"
            >
              {t('features.sectionTitleLine1')}
              <br />
              {t('features.sectionTitleLine2')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-sans text-lg lg:text-xl text-neutral-700 max-w-3xl mx-auto"
            >
              {t('features.sectionSubtitle')}
            </motion.p>
          </div>

          <FeatureGrid>
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </FeatureGrid>
        </div>
      </section>

      {/* AI Club Selection CTA */}
      <section className="py-16 bg-gradient-to-b from-white to-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary to-primary-600 rounded-3xl p-8 lg:p-12 shadow-2xl"
          >
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                {t('aiCta.heading')}
              </h2>
              <p className="text-lg lg:text-xl text-white/90 mb-8">
                {t('aiCta.body')}
              </p>
              <Button
                size="lg"
                onClick={() => setIsAIModalOpen(true)}
                className="bg-white text-primary hover:bg-white/90 font-semibold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('aiCta.button')}
              </Button>
            </div>
          </motion.div>
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
              {t('stats.titleStart')} <span className="text-primary">{t('stats.titleHighlight')}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg lg:text-xl text-text-secondary max-w-3xl mx-auto"
            >
              {t('stats.subtitle')}
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
              {t('howItWorks.titleStart')} <span className="text-primary">{t('howItWorks.titleHighlight')}</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '1',
                icon: UserPlus,
                title: t('howItWorks.step1Title'),
                description: t('howItWorks.step1Desc'),
              },
              {
                step: '2',
                icon: Map,
                title: t('howItWorks.step2Title'),
                description: t('howItWorks.step2Desc'),
              },
              {
                step: '3',
                icon: Target,
                title: t('howItWorks.step3Title'),
                description: t('howItWorks.step3Desc'),
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
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                  <Icon icon={item.icon} className="w-10 h-10 text-primary" />
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
              {t('testimonials.titleStart')} <span className="text-primary">{t('testimonials.titleHighlight')}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg lg:text-xl text-text-secondary max-w-3xl mx-auto"
            >
              {t('testimonials.subtitle')}
            </motion.p>
          </div>

          <TestimonialSlider />
        </div>
      </section>

      {/* Course Showcase Section */}
      <CourseShowcase />

      {/* CTA Section */}
      <CTASection />

      <Footer />

      {/* AI Club Selection Modal */}
      <AIClubSelectionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </div>
  );
}
