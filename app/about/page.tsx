/**
 * About Page
 * Company story, mission, and team
 */

'use client';

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { StatsCounter } from '@/components/StatsCounter';
import { CTASection } from '@/components/CTASection';
import { motion } from 'framer-motion';
import { Target, Users, Zap, Heart } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animations';

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Precision',
      description: 'We believe in accurate, data-driven recommendations that golfers can trust.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Golf is better together. We build features that connect and support golfers.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Leveraging cutting-edge AI to solve real problems golfers face on the course.',
    },
    {
      icon: Heart,
      title: 'Passion',
      description: 'Built by golfers, for golfers. We love the game as much as you do.',
    },
  ];

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
              Making Golf More{' '}
              <span className="text-primary">
                Enjoyable & Accessible
              </span>
            </motion.h1>
            <motion.p
              variants={staggerItem}
              className="text-xl text-text-secondary"
            >
              Copperline Golf was born from a simple idea: every golfer deserves the insights and confidence that come from having an expert caddy.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-background-light to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              We're on a mission to help golfers of all skill levels play smarter, not harder. By combining artificial intelligence with real-time course data, we provide personalized recommendations that make every round more enjoyable and every shot more confident.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Our Values
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
              { value: 50000, label: 'Active Users', suffix: '+' },
              { value: 2000000, label: 'Shots Tracked', suffix: '+' },
              { value: 2020, label: 'Founded' },
              { value: 98, label: 'Satisfaction', suffix: '%' },
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
