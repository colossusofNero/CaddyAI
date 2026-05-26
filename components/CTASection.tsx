/**
 * CTA Section Component
 * Call-to-action section with engaging visuals and animations
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { IconWithBackground, Icon, iconConfig } from '@/components/ui/Icon';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  showStats?: boolean;
}

export function CTASection({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  showStats = true,
}: CTASectionProps) {
  const t = useTranslations('marketing.ctaSection');
  const heading = title ?? t('title');
  const sub = subtitle ?? t('subtitle');
  const primary = primaryCTA ?? { text: t('ctaPrimary'), href: '/signup' };
  const secondary = secondaryCTA ?? { text: t('ctaSecondary'), href: '/pricing' };
  return (
    <section id="cta" className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop"
          alt="Golfer on course"
          fill
          className="object-cover opacity-20"
          sizes="100vw"
        />
      </div>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background-alt to-background opacity-90" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative bg-gradient-to-br from-secondary-800/80 to-secondary-900/80 backdrop-blur-xl border border-secondary-700 rounded-3xl lg:rounded-[3rem] p-8 lg:p-16 overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              variants={staggerItem}
              className="flex justify-center mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <Icon icon={Sparkles} {...iconConfig.badge} />
                <span className="text-sm font-medium text-primary">
                  {t('badge')}
                </span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              variants={staggerItem}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary text-center mb-6"
            >
              {heading}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              variants={staggerItem}
              className="text-lg lg:text-xl text-text-secondary text-center max-w-2xl mx-auto mb-10"
            >
              {sub}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href={primary.href}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto min-w-[200px] group">
                  {primary.text}
                  <Icon icon={ArrowRight} {...iconConfig.button} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {secondary && (
                <Link href={secondary.href}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto min-w-[200px]"
                  >
                    {secondary.text}
                  </Button>
                </Link>
              )}
            </motion.div>

            {/* Mini Stats/Benefits */}
            {showStats && (
              <motion.div
                variants={staggerItem}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 pt-8 border-t border-secondary-700"
              >
                <div className="bg-secondary-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                  <IconWithBackground
                    icon={Target}
                    size="md"
                    backgroundVariant="primary"
                    variant="primary"
                    className="flex-shrink-0"
                  />
                  <div>
                    <p className="font-bold text-text-primary">{t('mini1Title')}</p>
                    <p className="text-sm text-text-muted">
                      {t('mini1Subtitle')}
                    </p>
                  </div>
                </div>

                <div className="bg-secondary-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                  <IconWithBackground
                    icon={TrendingUp}
                    size="md"
                    backgroundVariant="accent"
                    variant="primary"
                    className="flex-shrink-0"
                  />
                  <div>
                    <p className="font-bold text-text-primary">{t('mini2Title')}</p>
                    <p className="text-sm text-text-muted">
                      {t('mini2Subtitle')}
                    </p>
                  </div>
                </div>

                <div className="bg-secondary-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                  <IconWithBackground
                    icon={Sparkles}
                    size="md"
                    backgroundVariant="primary"
                    variant="primary"
                    className="flex-shrink-0"
                  />
                  <div>
                    <p className="font-bold text-text-primary">{t('mini3Title')}</p>
                    <p className="text-sm text-text-muted">{t('mini3Subtitle')}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
