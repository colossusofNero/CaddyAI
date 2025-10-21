/**
 * Enhanced FeatureCard Component
 * Design System: Section 3 - Features Showcase
 * Updated with new color system and animations
 */

'use client';

import { motion } from 'framer-motion';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { fadeInUp } from '@/lib/animations';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  index?: number;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  index = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { duration: 0.3 },
      }}
      className="h-full"
    >
      <div className="h-full bg-white rounded-2xl p-8 border border-neutral-200 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer">
        {/* Icon Container with Gradient Background */}
        <motion.div
          whileHover={{
            rotate: 360,
            transition: { duration: 0.6, ease: 'easeInOut' },
          }}
          className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300"
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <h3 className="font-heading text-2xl font-semibold text-neutral-900 mb-4">
          {title}
        </h3>

        {/* Description */}
        <p className="font-body text-neutral-700 leading-relaxed mb-6 min-h-[80px]">
          {description}
        </p>

        {/* Learn More Link */}
        {href && (
          <motion.a
            href={href}
            whileHover={{ x: 4 }}
            className="inline-flex items-center gap-2 font-heading font-semibold text-primary hover:text-primary-600 transition-colors"
          >
            <span>Learn more</span>
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}

/**
 * FeatureGrid Component
 * Responsive grid container for feature cards
 */

interface FeatureGridProps {
  children: React.ReactNode;
}

export function FeatureGrid({ children }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
}
