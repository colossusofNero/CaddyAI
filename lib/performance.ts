// Performance Monitoring Utilities

// Core Web Vitals tracking
export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  if ('web-vital' in window.performance) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metric = entry as PerformanceEntry & { value?: number; id?: string };
        console.log(`[Web Vitals] ${metric.name}:`, metric.value);

        // Send to analytics
        if (window.gtag && metric.value !== undefined) {
          window.gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_category: 'Web Vitals',
            event_label: metric.id,
            non_interaction: true,
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['web-vital'] });
    } catch (_e) {
      console.warn('Web Vitals observer not supported');
    }
  }
}

// Performance metrics
export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  domLoad?: number;
  windowLoad?: number;
}

export function getPerformanceMetrics(): PerformanceMetrics {
  if (typeof window === 'undefined' || !window.performance) {
    return {};
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  const metrics: PerformanceMetrics = {
    ttfb: navigation?.responseStart - navigation?.requestStart,
    domLoad: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
    windowLoad: navigation?.loadEventEnd - navigation?.fetchStart,
  };

  // First Contentful Paint
  const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');
  if (fcp) {
    metrics.fcp = fcp.startTime;
  }

  return metrics;
}

// Track page load performance
export function trackPagePerformance(pageName: string) {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const metrics = getPerformanceMetrics();

      console.log(`[Performance] ${pageName}:`, metrics);

      // Send to analytics
      if (window.gtag && metrics.windowLoad) {
        window.gtag('event', 'page_load', {
          event_category: 'Performance',
          event_label: pageName,
          value: Math.round(metrics.windowLoad),
          non_interaction: true,
        });
      }
    }, 0);
  });
}

// Scroll depth tracking
export function trackScrollDepth() {
  if (typeof window === 'undefined') return;

  let maxScrollDepth = 0;
  const milestones = [25, 50, 75, 100];
  const tracked = new Set<number>();

  const handleScroll = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercentage = ((scrollTop + windowHeight) / documentHeight) * 100;

    maxScrollDepth = Math.max(maxScrollDepth, scrollPercentage);

    milestones.forEach((milestone) => {
      if (scrollPercentage >= milestone && !tracked.has(milestone)) {
        tracked.add(milestone);

        if (window.gtag) {
          window.gtag('event', 'scroll_depth', {
            event_category: 'Engagement',
            event_label: `${milestone}%`,
            value: milestone,
            non_interaction: true,
          });
        }
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}

// Time on page tracking
export function trackTimeOnPage(pageName: string) {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();
  const intervals = [10, 30, 60, 120, 300]; // seconds
  const tracked = new Set<number>();

  const checkInterval = setInterval(() => {
    const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

    intervals.forEach((interval) => {
      if (timeOnPage >= interval && !tracked.has(interval)) {
        tracked.add(interval);

        if (window.gtag) {
          window.gtag('event', 'time_on_page', {
            event_category: 'Engagement',
            event_label: pageName,
            value: interval,
            non_interaction: true,
          });
        }
      }
    });
  }, 1000);

  // Track time on page before unload
  const handleBeforeUnload = () => {
    const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

    if (window.gtag) {
      window.gtag('event', 'time_on_page_final', {
        event_category: 'Engagement',
        event_label: pageName,
        value: timeOnPage,
        non_interaction: true,
      });
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Cleanup
  return () => {
    clearInterval(checkInterval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

// Resource timing tracking
export function trackResourceTiming() {
  if (typeof window === 'undefined' || !window.performance) return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const stats = {
    scripts: 0,
    stylesheets: 0,
    images: 0,
    fonts: 0,
    other: 0,
    totalSize: 0,
    totalDuration: 0,
  };

  resources.forEach((resource) => {
    const size = resource.transferSize || 0;
    const duration = resource.duration;

    stats.totalSize += size;
    stats.totalDuration += duration;

    if (resource.initiatorType === 'script') stats.scripts++;
    else if (resource.initiatorType === 'link') stats.stylesheets++;
    else if (resource.initiatorType === 'img') stats.images++;
    else if (resource.initiatorType === 'css') stats.fonts++;
    else stats.other++;
  });

  console.log('[Resource Timing]', stats);

  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'resource_timing', {
      event_category: 'Performance',
      event_label: 'page_resources',
      value: Math.round(stats.totalDuration),
      non_interaction: true,
    });
  }
}

// Monitor long tasks (> 50ms)
export function monitorLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const task = entry as PerformanceEntry & { duration: number };
        if (task.duration > 50) {
          console.warn(`[Long Task] ${task.duration}ms`, task);

          if (window.gtag) {
            window.gtag('event', 'long_task', {
              event_category: 'Performance',
              event_label: 'task_blocking',
              value: Math.round(task.duration),
              non_interaction: true,
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (_e) {
    console.warn('Long task monitoring not supported');
  }
}

// Initialize all performance tracking
export function initPerformanceTracking(pageName: string) {
  if (typeof window === 'undefined') return;

  reportWebVitals();
  trackPagePerformance(pageName);
  monitorLongTasks();

  // Track after page is fully loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      trackResourceTiming();
    }, 0);
  });

  // Start tracking scroll depth and time on page
  const cleanupScroll = trackScrollDepth();
  const cleanupTime = trackTimeOnPage(pageName);

  return () => {
    cleanupScroll?.();
    cleanupTime?.();
  };
}
