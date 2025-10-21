/**
 * PricingCard Component
 * Displays pricing tiers with features, CTAs, monthly/annual toggle, and tooltips
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fadeInUp, scaleOnHover } from '@/lib/animations';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  popular?: boolean;
  features: string[];
  featureTooltips?: Record<string, string>;
  cta: string;
  ctaLink: string;
}

interface PricingCardProps {
  tier: PricingTier;
  isAnnual: boolean;
  index?: number;
}

export function PricingCard({ tier, isAnnual, index = 0 }: PricingCardProps) {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const price = isAnnual ? tier.priceAnnual : tier.priceMonthly;
  const savings = tier.priceMonthly * 12 - tier.priceAnnual;
  const savingsPercentage = Math.round((savings / (tier.priceMonthly * 12)) * 100);

  return (
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
      <div
        className={`relative h-full bg-secondary-800/50 backdrop-blur-sm border rounded-3xl p-8 flex flex-col ${
          tier.popular
            ? 'border-primary shadow-primary/20 shadow-2xl scale-105'
            : 'border-secondary-700'
        }`}
      >
        {/* Popular Badge */}
        {tier.popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span>Most Popular</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-text-primary mb-2">
            {tier.name}
          </h3>
          <p className="text-text-secondary text-sm">{tier.description}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-text-primary">
              ${price}
            </span>
            <span className="text-text-secondary">
              /{isAnnual ? 'year' : 'month'}
            </span>
          </div>

          {isAnnual && savings > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 inline-flex items-center gap-1 text-sm text-primary font-medium"
            >
              <span>Save ${savings}</span>
              <span className="text-text-muted">({savingsPercentage}% off)</span>
            </motion.div>
          )}
        </div>

        {/* CTA Button */}
        <Link href={tier.ctaLink} className="mb-8">
          <Button
            variant={tier.popular ? 'primary' : 'outline'}
            size="lg"
            className="w-full"
          >
            {tier.cta}
          </Button>
        </Link>

        {/* Features List */}
        <ul className="space-y-4 flex-grow">
          {tier.features.map((feature, featureIndex) => {
            const hasTooltip = tier.featureTooltips?.[feature];

            return (
              <li key={featureIndex} className="flex items-start gap-3 group">
                <Check
                  className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="text-text-secondary group-hover:text-text-primary transition-colors flex-grow">
                  {feature}
                </span>

                {/* Tooltip */}
                {hasTooltip && (
                  <div className="relative">
                    <button
                      onMouseEnter={() => setHoveredFeature(feature)}
                      onMouseLeave={() => setHoveredFeature(null)}
                      onClick={(e) => {
                        e.preventDefault();
                        setHoveredFeature(
                          hoveredFeature === feature ? null : feature
                        );
                      }}
                      className="text-text-muted hover:text-primary transition-colors"
                      aria-label={`More info about ${feature}`}
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>

                    {hoveredFeature === feature && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 bottom-full mb-2 w-64 bg-secondary-900 border border-secondary-700 rounded-lg p-3 shadow-xl z-10"
                      >
                        <p className="text-sm text-text-secondary">
                          {tier.featureTooltips![feature]}
                        </p>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-secondary-700" />
                      </motion.div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Background Gradient */}
        {tier.popular && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl pointer-events-none" />
        )}
      </div>
    </motion.div>
  );
}

/**
 * PricingToggle Component
 * Toggle between monthly and annual billing
 */
interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
}

export function PricingToggle({ isAnnual, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <span
        className={`font-medium transition-colors ${
          !isAnnual ? 'text-text-primary' : 'text-text-muted'
        }`}
      >
        Monthly
      </span>

      <button
        onClick={() => onToggle(!isAnnual)}
        className={`relative w-16 h-8 rounded-full transition-colors ${
          isAnnual ? 'bg-primary' : 'bg-secondary-600'
        }`}
        role="switch"
        aria-checked={isAnnual}
        aria-label="Toggle between monthly and annual billing"
      >
        <motion.div
          animate={{ x: isAnnual ? 32 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md"
        />
      </button>

      <span
        className={`font-medium transition-colors ${
          isAnnual ? 'text-text-primary' : 'text-text-muted'
        }`}
      >
        Annual
        <span className="ml-2 text-sm text-primary">(Save 20%)</span>
      </span>
    </div>
  );
}
