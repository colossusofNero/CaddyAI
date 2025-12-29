/**
 * Hero Section Component
 * Features video background with fallback, text overlay with animations,
 * dual CTAs, floating phone mockup with 3D tilt, and scroll indicator
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronDown, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Icon, iconConfig } from '@/components/ui/Icon';
import { fadeIn, fadeInUp, staggerContainer, staggerItem, bounce } from '@/lib/animations';

interface HeroProps {
  videoSrc?: string;
  fallbackImage?: string;
  title?: string;
  subtitle?: string;
}

export function Hero({
  videoSrc = '/videos/golf-hero.mp4',
  fallbackImage = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop',
  title = 'Your AI Caddy in Your Pocket',
  subtitle = 'Make every shot count with real-time club recommendations powered by AI',
}: HeroProps) {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Mouse position for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Transform mouse position to rotation values
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!phoneRef.current) return;

      const rect = phoneRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleScrollDown = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background to-background-light"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {/* Beautiful Golf Course Background */}
        <div className="relative w-full h-full">
          <Image
            src={fallbackImage}
            alt="Beautiful golf course aerial view"
            fill
            priority
            className="object-cover opacity-25"
            sizes="100vw"
          />
        </div>

        {/* Gradient Overlay - Design System: 135deg green-to-blue */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/40 to-accent/40" />
      </div>

      {/* Large Background Logo - Top Left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1.2 }}
        className="absolute top-0 left-0 z-5 pointer-events-none"
      >
        <div className="relative w-[640px] h-[640px] sm:w-[800px] sm:h-[800px] lg:w-[960px] lg:h-[960px]">
          <Image
            src="/logo.png"
            alt="Copperline Golf Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Badge - Updated with new secondary color */}
            <motion.div
              variants={staggerItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full mb-6 backdrop-blur-sm"
            >
              <Icon icon={Sparkles} {...iconConfig.badge} variant="secondary" />
              <span className="text-sm font-semibold text-white">
                AI-Powered Golf Assistant
              </span>
            </motion.div>

            {/* Title - Mobile-first responsive sizing */}
            <motion.h1
              variants={staggerItem}
              className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[72px] font-bold text-white mb-4 sm:mb-6 leading-[1.1] tracking-tight"
            >
              {title}
            </motion.h1>

            {/* Subtitle - Mobile-optimized (min 16px for iOS) */}
            <motion.p
              variants={staggerItem}
              className="font-sans text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed"
            >
              {subtitle}
            </motion.p>

            {/* CTAs - Design System: Primary + Secondary */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px] bg-primary hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                >
                  Start Free Trial →
                </Button>
              </Link>
              <Link href="/features">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px] group border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 backdrop-blur-sm"
                >
                  <Icon icon={Play} {...iconConfig.button} className="mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>

            {/* Stat Ticker - Design System: "Join 50,000+ golfers | 2M+ shots analyzed" */}
            <motion.div
              variants={staggerItem}
              className="mt-8 flex items-center gap-4 justify-center lg:justify-start text-sm text-neutral-700 font-sans"
            >
              <span className="font-semibold">Join 50,000+ golfers</span>
              <span className="text-neutral-400">|</span>
              <span className="font-semibold">2M+ shots analyzed</span>
            </motion.div>
          </motion.div>

          {/* Phone Mockup with 3D Tilt */}
          <motion.div
            ref={phoneRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:flex justify-center items-center"
            style={{ perspective: 1000 }}
          >
            <motion.div
              style={{
                rotateX,
                rotateY,
              }}
              transition={{ type: 'spring', stiffness: 100, damping: 30 }}
              className="relative w-full max-w-sm"
            >
              {/* Glow Effect - Secondary color (vibrant green) */}
              <div className="absolute inset-0 bg-secondary/20 blur-3xl rounded-3xl animate-pulse" />

              {/* Phone Frame */}
              <div className="relative bg-secondary-900 rounded-[3rem] p-3 shadow-2xl border-4 border-secondary-700">
                <div className="relative aspect-[9/19] bg-background rounded-[2.5rem] overflow-hidden">
                  {/* Real App Screenshot */}
                  <Image
                    src="/screenshots/Screenshot_20251218-081027.png"
                    alt="Copperline Golf App Screenshot"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                  />
                </div>

                {/* Notch */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-secondary-900 rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        variants={bounce}
        animate="animate"
        onClick={handleScrollDown}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 p-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer group"
        aria-label="Scroll to features"
      >
        <Icon icon={ChevronDown} size="lg" variant="primary" className="group-hover:text-primary-400 transition-colors" />
      </motion.button>
    </section>
  );
}
