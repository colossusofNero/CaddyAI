/**
 * FeatureCard Component
 * Displays a feature with icon, title, and description.
 * Includes hover lift effect, border glow, and stagger animations.
 */

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { fadeInUp, cardHover } from '@/lib/animations';

interface FeatureCardProps {
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
  const card = (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            delay: index * 0.1,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      className="h-full"
    >
      <motion.div
        whileHover="hover"
        className="h-full bg-secondary-800/50 backdrop-blur-sm border border-secondary-700 rounded-2xl p-6 lg:p-8 cursor-pointer group relative overflow-hidden transition-colors duration-300"
      >
        {/* Gradient Border Glow on Hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(135deg, rgba(5, 161, 70, 0.2), rgba(59, 130, 246, 0.2))',
            borderRadius: 'inherit',
          }}
        />

        {/* Card Content */}
        <div className="relative z-10">
          {/* Icon Container */}
          <motion.div
            variants={{
              hover: {
                scale: 1.1,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.5 },
              },
            }}
            className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl lg:rounded-2xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg group-hover:shadow-primary/50 transition-shadow duration-300"
          >
            <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-primary group-hover:text-primary-400 transition-colors duration-300" />
          </motion.div>

          {/* Title */}
          <h3 className="text-xl lg:text-2xl font-bold text-text-primary mb-3 lg:mb-4 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>

          {/* Description */}
          <p className="text-text-secondary leading-relaxed mb-4">
            {description}
          </p>

          {/* Learn More Link */}
          {href && (
            <motion.div
              variants={{
                hover: { x: 5 },
              }}
              className="flex items-center gap-2 text-primary group-hover:text-primary-400 font-medium transition-colors duration-300"
            >
              <span>Learn more</span>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          )}
        </div>

        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
      </motion.div>
    </motion.div>
  );

  // Wrap in Link if href is provided
  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    );
  }

  return card;
}

/**
 * FeatureGrid Component
 * Container for feature cards with responsive grid layout
 */
interface FeatureGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function FeatureGrid({ children, columns = 3 }: FeatureGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={`grid grid-cols-1 ${gridCols[columns]} gap-6 lg:gap-8`}
    >
      {children}
    </div>
  );
}
