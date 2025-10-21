/**
 * Design Tokens
 * Centralized design system tokens for consistent styling across the application
 * NOTE: Colors now use CSS variables defined in globals.css for theme support
 */

export const designTokens = {
  // Colors - Using CSS variables for theme switching
  colors: {
    primary: {
      DEFAULT: 'var(--color-primary)',
      50: 'var(--color-primary-50)',
      100: 'var(--color-primary-100)',
      200: 'var(--color-primary-200)',
      300: 'var(--color-primary-300)',
      400: 'var(--color-primary-400)',
      500: 'var(--color-primary-500)',
      600: 'var(--color-primary-600)',
      700: 'var(--color-primary-700)',
      800: 'var(--color-primary-800)',
      900: 'var(--color-primary-900)',
    },
    secondary: {
      DEFAULT: 'var(--color-secondary)',
      50: 'var(--color-secondary-50)',
      100: 'var(--color-secondary-100)',
      200: 'var(--color-secondary-200)',
      300: 'var(--color-secondary-300)',
      400: 'var(--color-secondary-400)',
      500: 'var(--color-secondary-500)',
      600: 'var(--color-secondary-600)',
      700: 'var(--color-secondary-700)',
      800: 'var(--color-secondary-800)',
      900: 'var(--color-secondary-900)',
    },
    accent: {
      DEFAULT: 'var(--color-accent)',
      50: 'var(--color-accent-50)',
      100: 'var(--color-accent-100)',
      200: 'var(--color-accent-200)',
      300: 'var(--color-accent-300)',
      400: 'var(--color-accent-400)',
      500: 'var(--color-accent-500)',
      600: 'var(--color-accent-600)',
      700: 'var(--color-accent-700)',
      800: 'var(--color-accent-800)',
      900: 'var(--color-accent-900)',
    },
    neutral: {
      DEFAULT: 'var(--color-neutral)',
      50: 'var(--color-neutral-50)',
      100: 'var(--color-neutral-100)',
      200: 'var(--color-neutral-200)',
      300: 'var(--color-neutral-300)',
      400: 'var(--color-neutral-400)',
      500: 'var(--color-neutral-500)',
      600: 'var(--color-neutral-600)',
      700: 'var(--color-neutral-700)',
      800: 'var(--color-neutral-800)',
      900: 'var(--color-neutral-900)',
    },
    gold: {
      DEFAULT: 'var(--color-gold)',
      50: 'var(--color-gold-50)',
      100: 'var(--color-gold-100)',
      200: 'var(--color-gold-200)',
      300: 'var(--color-gold-300)',
      400: 'var(--color-gold-400)',
      500: 'var(--color-gold-500)',
      600: 'var(--color-gold-600)',
      700: 'var(--color-gold-700)',
      800: 'var(--color-gold-800)',
      900: 'var(--color-gold-900)',
    },
    background: {
      DEFAULT: 'var(--color-background)',
      alt: 'var(--color-background-alt)',
      elevated: 'var(--color-background-elevated)',
      muted: 'var(--color-background-muted)',
    },
    foreground: {
      DEFAULT: 'var(--color-foreground)',
      secondary: 'var(--color-foreground-secondary)',
      muted: 'var(--color-foreground-muted)',
    },
    text: {
      primary: 'var(--color-foreground)',
      secondary: 'var(--color-foreground-secondary)',
      muted: 'var(--color-foreground-muted)',
    },
    status: {
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      error: 'var(--color-error)',
      info: 'var(--color-info)',
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem',    // 128px
  },

  // Typography
  typography: {
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px
    },
    fontWeights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadows - Using CSS variables for theme support
  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    card: 'var(--shadow-card)',
    primary: 'var(--shadow-primary)',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },

  // Transitions
  transitions: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    timing: {
      ease: 'ease',
      linear: 'linear',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const;

// Helper function to get color with opacity
export function colorWithOpacity(color: string, opacity: number): string {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

// Helper function to create responsive values
export function responsive<T>(
  mobile: T,
  tablet?: T,
  desktop?: T,
  wide?: T
): Record<string, T> {
  return {
    default: mobile,
    ...(tablet && { sm: tablet }),
    ...(desktop && { md: desktop }),
    ...(wide && { lg: wide }),
  };
}

// Export individual token categories for convenience
export const colors = designTokens.colors;
export const spacing = designTokens.spacing;
export const typography = designTokens.typography;
export const borderRadius = designTokens.borderRadius;
export const shadows = designTokens.shadows;
export const breakpoints = designTokens.breakpoints;
export const zIndex = designTokens.zIndex;
export const transitions = designTokens.transitions;
