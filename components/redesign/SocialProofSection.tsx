/**
 * Social Proof Section Component
 * Design System: Section 2 - Social Proof
 * Features: Testimonial carousel, trust badges, live counter
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TestimonialCard, TestimonialCardProps } from './TestimonialCard';
import { TrustBadge } from './TrustBadge';
import { StatCounter } from './StatCounter';
import { Star, Smartphone, Award, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { fadeInUp } from '@/lib/animations';

export function SocialProofSection() {
  const t = useTranslations('marketing.socialProof');

  const testimonials: TestimonialCardProps[] = [
    { quote: t('t1Quote'), author: 'Sarah Johnson', role: t('t1Role'), location: 'California', avatar: '', rating: 5, verified: true },
    { quote: t('t2Quote'), author: 'Mike Torres', role: t('t2Role'), location: 'Texas', avatar: '', rating: 4, verified: true },
    { quote: t('t3Quote'), author: 'David Lee', role: t('t3Role'), location: 'Florida', avatar: '', rating: 5, verified: true },
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [golfersOnCourse, setGolfersOnCourse] = useState(
    Math.floor(Math.random() * (30000 - 20000) + 20000)
  );

  // Auto-rotate testimonials every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // Update golfers counter every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setGolfersOnCourse(Math.floor(Math.random() * (30000 - 20000) + 20000));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const getVisibleTestimonials = () => {
    // Desktop: show 3 testimonials
    // Mobile: show 1 testimonial
    return [
      testimonials[currentIndex],
      testimonials[(currentIndex + 1) % testimonials.length],
      testimonials[(currentIndex + 2) % testimonials.length],
    ];
  };

  return (
    <section className="py-20 lg:py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <motion.h2
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-sans text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4"
          >
            {t('heading')}
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-lg lg:text-xl text-neutral-700 max-w-3xl mx-auto"
          >
            {t('subheading')}
          </motion.p>
        </div>

        {/* Testimonial Carousel - Desktop (3 cards) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-12">
          {getVisibleTestimonials().map((testimonial, index) => (
            <TestimonialCard
              key={`${testimonial.author}-${index}`}
              {...testimonial}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Testimonial Carousel - Mobile (1 card with navigation) */}
        <div className="lg:hidden mb-12">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <TestimonialCard {...testimonials[currentIndex]} />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={handlePrevious}
                className="p-2 rounded-full bg-white border border-neutral-200 hover:border-primary hover:bg-primary-50 transition-colors"
                aria-label={t('prevAria')}
              >
                <ChevronLeft className="w-5 h-5 text-neutral-700" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-primary w-6'
                        : 'bg-neutral-300 hover:bg-neutral-400'
                    }`}
                    aria-label={t('dotAria', { n: index + 1 })}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-white border border-neutral-200 hover:border-primary hover:bg-primary-50 transition-colors"
                aria-label={t('nextAria')}
              >
                <ChevronRight className="w-5 h-5 text-neutral-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Dots - Desktop */}
        <div className="hidden lg:flex justify-center gap-2 mb-12">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary w-6'
                  : 'bg-neutral-300 hover:bg-neutral-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Trust Badges Row */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 py-8 border-y border-neutral-200 mb-12"
        >
          <TrustBadge
            icon={Star}
            label={t('badge1Label')}
            sublabel={t('badge1Sublabel')}
            delay={0}
          />
          <TrustBadge
            icon={Smartphone}
            label={t('badge2Label')}
            sublabel={t('badge2Sublabel')}
            delay={0.1}
          />
          <TrustBadge
            icon={Award}
            label={t('badge3Label')}
            sublabel={t('badge3Sublabel')}
            delay={0.2}
          />
          <TrustBadge
            icon={Shield}
            label={t('badge4Label')}
            sublabel={t('badge4Sublabel')}
            delay={0.3}
          />
        </motion.div>

        {/* Live Counter */}
        <div className="text-center">
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-sans text-neutral-700 text-lg mb-4"
          >
            {t('liveCounter')}
          </motion.p>
          <StatCounter
            endValue={golfersOnCourse}
            suffix=""
            duration={2000}
            delay={200}
          />
        </div>
      </div>
    </section>
  );
}
