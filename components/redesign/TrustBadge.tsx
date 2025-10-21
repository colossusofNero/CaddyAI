/**
 * TrustBadge Component
 * Design System: Social Proof Section
 * Displays trust signals like app store ratings, download counts, etc.
 */

'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { fadeIn } from '@/lib/animations';

export interface TrustBadgeProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  delay?: number;
}

export function TrustBadge({
  icon: Icon,
  label,
  sublabel,
  delay = 0,
}: TrustBadgeProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      transition={{ delay }}
      className="flex items-center gap-3"
    >
      <div className="flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="font-heading font-semibold text-neutral-900 text-sm">
          {label}
        </span>
        {sublabel && (
          <span className="font-body text-xs text-neutral-600">
            {sublabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}
