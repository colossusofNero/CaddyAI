/**
 * Analytics & Tracking
 * Integration for Google Analytics, Hotjar, and conversion tracking
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Extended type definitions for Hotjar
declare global {
  interface Window {
    hj?: (...args: unknown[]) => void;
    _hjSettings?: { hjid: number; hjsv: number };
  }
}

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
        page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
      });
    }
  }, [pathname, searchParams]);

  return null;
}

// Custom event tracking functions
export const trackEvent = {
  // Conversion events
  signupStarted: (method: 'email' | 'google') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'signup_started', {
        method,
        event_category: 'conversion',
        event_label: 'Signup Flow',
      });
    }
  },

  signupCompleted: (method: 'email' | 'google') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sign_up', {
        method,
        event_category: 'conversion',
        event_label: 'Signup Completed',
      });
    }
  },

  trialStarted: () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_trial', {
        event_category: 'conversion',
        event_label: 'Free Trial Started',
      });
    }
  },

  // Engagement events
  demoInteraction: (action: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'demo_interaction', {
        action,
        event_category: 'engagement',
        event_label: 'Interactive Demo',
      });
    }
  },

  calculatorUsed: (handicap: number, improvement: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'calculator_used', {
        handicap,
        improvement,
        event_category: 'engagement',
        event_label: 'Comparison Calculator',
      });
    }
  },

  videoPlayed: (videoName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'video_play', {
        video_name: videoName,
        event_category: 'engagement',
        event_label: 'Video Demo',
      });
    }
  },

  // Lead generation
  leadCaptured: (source: 'exit_intent' | 'newsletter' | 'download') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        source,
        event_category: 'lead_gen',
        event_label: 'Email Captured',
      });
    }
  },

  // Navigation
  ctaClicked: (location: string, text: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cta_click', {
        location,
        text,
        event_category: 'navigation',
        event_label: 'CTA Button',
      });
    }
  },

  // Scroll depth tracking
  scrollDepth: (percentage: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'scroll', {
        percent_scrolled: percentage,
        event_category: 'engagement',
        event_label: 'Scroll Depth',
      });
    }
  },
};

// Scroll depth tracker component
export function ScrollDepthTracker() {
  useEffect(() => {
    const thresholds = [25, 50, 75, 100];
    const tracked = new Set<number>();

    const handleScroll = () => {
      const scrollPercentage = Math.round(
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      );

      thresholds.forEach((threshold) => {
        if (scrollPercentage >= threshold && !tracked.has(threshold)) {
          tracked.add(threshold);
          trackEvent.scrollDepth(threshold);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}

// Form analytics tracker
export function trackFormEvent(formName: string, action: 'started' | 'field_interaction' | 'error' | 'abandoned' | 'submitted', field?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', `form_${action}`, {
      form_name: formName,
      field_name: field,
      event_category: 'form',
      event_label: `Form ${action}`,
    });
  }
}

// A/B test variant tracking
export function trackABTest(testName: string, variant: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ab_test_impression', {
      test_name: testName,
      variant,
      event_category: 'experiment',
      event_label: 'A/B Test',
    });
  }
}

// Performance tracking
export function trackPerformance(metric: string, value: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'performance_metric', {
      metric_name: metric,
      value,
      event_category: 'performance',
      event_label: 'Site Performance',
    });
  }
}
