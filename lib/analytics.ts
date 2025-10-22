// Google Analytics 4 Configuration and Tracking

// Type definitions for analytics
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Add GA4 measurement ID to environment variables
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Page view tracking
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Event tracking interface
interface GtagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// Generic event tracking
export const event = ({ action, category, label, value }: GtagEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific event tracking functions

// Authentication events
export const trackSignUp = (method: 'email' | 'google' | 'apple') => {
  event({
    action: 'sign_up',
    category: 'Authentication',
    label: method,
  });
};

export const trackLogin = (method: 'email' | 'google' | 'apple') => {
  event({
    action: 'login',
    category: 'Authentication',
    label: method,
  });
};

// Round tracking
export const trackStartRound = (courseName?: string) => {
  event({
    action: 'start_round',
    category: 'Golf Activity',
    label: courseName || 'unknown',
  });
};

export const trackEndRound = (holesPlayed: number) => {
  event({
    action: 'end_round',
    category: 'Golf Activity',
    value: holesPlayed,
  });
};

// Club recommendation events
export const trackClubRecommendation = (club: string, distance?: number) => {
  event({
    action: 'club_recommendation_viewed',
    category: 'AI Features',
    label: club,
    value: distance,
  });
};

export const trackClubSelection = (club: string) => {
  event({
    action: 'club_selected',
    category: 'User Action',
    label: club,
  });
};

// Course search
export const trackCourseSearch = (query: string) => {
  event({
    action: 'course_searched',
    category: 'Search',
    label: query,
  });
};

export const trackCourseSelected = (courseName: string) => {
  event({
    action: 'course_selected',
    category: 'User Action',
    label: courseName,
  });
};

// App download
export const trackDownloadClick = (platform: 'ios' | 'android') => {
  event({
    action: 'download_app_clicked',
    category: 'Conversion',
    label: platform,
  });
};

// Pricing events
export const trackPricingView = (plan?: string) => {
  event({
    action: 'pricing_viewed',
    category: 'Conversion',
    label: plan || 'all',
  });
};

export const trackPlanSelect = (plan: string) => {
  event({
    action: 'plan_selected',
    category: 'Conversion',
    label: plan,
  });
};

// Form events
export const trackFormSubmit = (formName: string) => {
  event({
    action: 'form_submit',
    category: 'Engagement',
    label: formName,
  });
};

export const trackFormError = (formName: string, errorType: string) => {
  event({
    action: 'form_error',
    category: 'Error',
    label: `${formName}: ${errorType}`,
  });
};

// Navigation events
export const trackNavClick = (destination: string) => {
  event({
    action: 'navigation_click',
    category: 'Navigation',
    label: destination,
  });
};

// Feature usage
export const trackFeatureUse = (featureName: string) => {
  event({
    action: 'feature_used',
    category: 'Engagement',
    label: featureName,
  });
};

// Error tracking
export const trackError = (errorMessage: string, errorLocation: string) => {
  event({
    action: 'error_occurred',
    category: 'Error',
    label: `${errorLocation}: ${errorMessage}`,
  });
};

// User engagement
export const trackTimeOnPage = (pageName: string, seconds: number) => {
  event({
    action: 'time_on_page',
    category: 'Engagement',
    label: pageName,
    value: seconds,
  });
};

export const trackScrollDepth = (percentage: number) => {
  event({
    action: 'scroll_depth',
    category: 'Engagement',
    value: percentage,
  });
};

// Social sharing
export const trackSocialShare = (platform: string, content: string) => {
  event({
    action: 'social_share',
    category: 'Engagement',
    label: `${platform}: ${content}`,
  });
};

// Custom dimensions helper
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', properties);
  }
};

// User identification (for authenticated users)
export const identifyUser = (userId: string, properties?: {
  handicap?: number;
  membershipLevel?: string;
  clubCount?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      user_id: userId,
    });

    if (properties) {
      setUserProperties(properties);
    }
  }
};
