/**
 * Responsive Design Utilities
 * Mobile-first responsive design helpers, constants, and utilities
 */

// Breakpoints (matches Tailwind defaults)
export const BREAKPOINTS = {
  sm: 640,  // Mobile landscape
  md: 768,  // Tablet
  lg: 1024, // Desktop
  xl: 1280, // Large desktop
  '2xl': 1536, // Extra large
} as const;

// Touch target sizes (WCAG 2.1 Level AAA)
export const TOUCH_TARGET = {
  min: 44, // Minimum touch target size in pixels
  comfortable: 48, // Comfortable touch target size
  spacious: 56, // Spacious touch target size for primary actions
} as const;

// Responsive typography scale
export const TYPOGRAPHY = {
  // Display text (hero headlines)
  display: {
    mobile: 'text-4xl sm:text-5xl', // 36px -> 48px
    tablet: 'md:text-6xl', // 60px
    desktop: 'lg:text-7xl xl:text-[72px]', // 72px -> 72px
    full: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[72px]',
  },
  // H1 headings
  h1: {
    mobile: 'text-3xl sm:text-4xl', // 30px -> 36px
    tablet: 'md:text-5xl', // 48px
    desktop: 'lg:text-6xl', // 60px
    full: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
  },
  // H2 headings
  h2: {
    mobile: 'text-2xl sm:text-3xl', // 24px -> 30px
    tablet: 'md:text-4xl', // 36px
    desktop: 'lg:text-5xl', // 48px
    full: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  },
  // H3 headings
  h3: {
    mobile: 'text-xl sm:text-2xl', // 20px -> 24px
    tablet: 'md:text-3xl', // 30px
    desktop: 'lg:text-4xl', // 36px
    full: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  },
  // H4 headings
  h4: {
    mobile: 'text-lg sm:text-xl', // 18px -> 20px
    tablet: 'md:text-2xl', // 24px
    desktop: 'lg:text-3xl', // 30px
    full: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  },
  // Body text
  body: {
    mobile: 'text-base', // 16px
    tablet: 'md:text-lg', // 18px
    desktop: 'lg:text-xl', // 20px
    full: 'text-base md:text-lg lg:text-xl',
  },
  // Body small
  bodySmall: {
    mobile: 'text-sm', // 14px
    tablet: 'md:text-base', // 16px
    full: 'text-sm md:text-base',
  },
  // Caption/small text
  caption: {
    mobile: 'text-xs', // 12px
    tablet: 'md:text-sm', // 14px
    full: 'text-xs md:text-sm',
  },
} as const;

// Responsive spacing
export const SPACING = {
  section: {
    mobile: 'py-12', // 48px
    tablet: 'md:py-16', // 64px
    desktop: 'lg:py-24 xl:py-32', // 96px -> 128px
    full: 'py-12 md:py-16 lg:py-24 xl:py-32',
  },
  container: {
    mobile: 'px-4', // 16px
    tablet: 'sm:px-6', // 24px
    desktop: 'lg:px-8', // 32px
    full: 'px-4 sm:px-6 lg:px-8',
  },
  gap: {
    mobile: 'gap-4', // 16px
    tablet: 'md:gap-6', // 24px
    desktop: 'lg:gap-8', // 32px
    full: 'gap-4 md:gap-6 lg:gap-8',
  },
} as const;

// Responsive grid patterns
export const GRID = {
  // Feature cards (1 -> 2 -> 3)
  features: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  // Stats/counters (2 -> 3 -> 4)
  stats: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  // Blog/content (1 -> 2 -> 3)
  content: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  // Two column layout (1 -> 2)
  twoCol: 'grid-cols-1 lg:grid-cols-2',
  // Sidebar layout (1 -> 3/1)
  sidebar: 'grid-cols-1 lg:grid-cols-[3fr,1fr]',
  // Footer columns (2 -> 4)
  footer: 'grid-cols-2 md:grid-cols-4',
} as const;

// Device detection helpers
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
};

// Touch device detection
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Viewport utilities
export const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

// Media query hook helper (for SSR-safe usage)
export const useMediaQuery = (query: string): boolean => {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia(query);
  return mediaQuery.matches;
};

// Common responsive class combinations
export const RESPONSIVE = {
  // Button sizes with proper touch targets
  button: {
    sm: 'h-10 px-4 text-sm', // 40px height (below min, for secondary actions)
    md: 'h-11 px-6 text-base sm:h-12', // 44px -> 48px (meets touch target)
    lg: 'h-12 px-8 text-lg sm:h-14', // 48px -> 56px (spacious)
  },
  // Input fields
  input: {
    default: 'h-11 px-4 text-base sm:h-12', // 44px -> 48px
    large: 'h-12 px-6 text-lg sm:h-14', // 48px -> 56px
  },
  // Card padding
  card: {
    mobile: 'p-4', // 16px
    tablet: 'sm:p-6', // 24px
    desktop: 'lg:p-8', // 32px
    full: 'p-4 sm:p-6 lg:p-8',
  },
  // Navigation height
  nav: {
    height: 'h-16 lg:h-20', // 64px -> 80px
  },
} as const;

// PWA viewport meta tag helper
export const PWA_VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes';

// Safe area insets for notched devices (iPhone X, etc.)
export const SAFE_AREA = {
  top: 'pt-[env(safe-area-inset-top)]',
  bottom: 'pb-[env(safe-area-inset-bottom)]',
  left: 'pl-[env(safe-area-inset-left)]',
  right: 'pr-[env(safe-area-inset-right)]',
} as const;

// Orientation detection
export const isPortrait = () => {
  if (typeof window === 'undefined') return true;
  return window.innerHeight > window.innerWidth;
};

export const isLandscape = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};
