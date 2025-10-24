/**
 * StatsCounter Component
 * Animated number counter with Intersection Observer
 * Triggers count-up animation when scrolled into view
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

interface StatsCounterProps {
  stats: StatItem[];
}

export function StatsCounter({ stats }: StatsCounterProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
      {stats.map((stat, index) => (
        <AnimatedStat key={index} stat={stat} index={index} />
      ))}
    </div>
  );
}

/**
 * AnimatedStat Component
 * Individual stat with count-up animation
 */
function AnimatedStat({ stat, index }: { stat: StatItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [hasAnimated, setHasAnimated] = useState(false);

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });

  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      motionValue.set(stat.value);
    }
  }, [isInView, hasAnimated, motionValue, stat.value]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(formatNumber(Math.floor(latest)));
    });

    return () => unsubscribe();
  }, [springValue]);

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={{
        hidden: { opacity: 0, y: 30 },
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
      className="text-center"
    >
      <div className="mb-2">
        <span className="text-4xl lg:text-5xl xl:text-6xl font-bold text-primary">
          {stat.prefix}
          {displayValue}
          {stat.suffix}
        </span>
      </div>
      <p className="text-neutral-700 text-sm lg:text-base font-medium">
        {stat.label}
      </p>
    </motion.div>
  );
}

/**
 * Default Stats Data
 */
export const defaultStats: StatItem[] = [
  {
    value: 50000,
    label: 'Active Golfers',
    suffix: '+',
  },
  {
    value: 2000000,
    label: 'Shots Analyzed',
    suffix: '+',
  },
  {
    value: 15000,
    label: 'Courses Mapped',
    suffix: '+',
  },
  {
    value: 98,
    label: 'Satisfaction Rate',
    suffix: '%',
  },
];
