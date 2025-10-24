/**
 * StatCounter Component
 * Design System: Social Proof Section
 * Animates numbers counting up when scrolled into view
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { fadeIn } from '@/lib/animations';

export interface StatCounterProps {
  endValue: number;
  suffix?: string;
  label?: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export function StatCounter({
  endValue,
  suffix = '',
  label,
  duration = 2000,
  delay = 0,
  className = '',
}: StatCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      const startTime = Date.now() + delay;
      const startValue = count; // Start from current value

      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed < 0) return; // Wait for delay

        if (elapsed >= duration) {
          setCount(endValue);
          clearInterval(timer);
        } else {
          const progress = elapsed / duration;
          const easeOutQuad = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(startValue + (endValue - startValue) * easeOutQuad));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, endValue, duration, delay]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <motion.div
      ref={ref}
      variants={fadeIn}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: delay / 1000 }}
      className={`text-center ${className}`}
    >
      <div className="font-sans font-bold text-4xl lg:text-5xl text-primary mb-2">
        {formatNumber(count)}{suffix}
      </div>
      {label && (
        <div className="font-sans text-sm text-neutral-600">
          {label}
        </div>
      )}
    </motion.div>
  );
}
