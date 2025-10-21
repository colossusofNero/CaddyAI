/**
 * Design Tokens
 * Centralized design system tokens for consistent styling across the application
 */

export const designTokens = {
  // Colors
  colors: {
    primary: {
      DEFAULT: '#05A146',
      50: '#e6f7ed',
      100: '#ccefdb',
      200: '#99dfb7',
      300: '#66cf93',
      400: '#33bf6f',
      500: '#05A146',
      600: '#048138',
      700: '#03612a',
      800: '#02401c',
      900: '#01200e',
    },
    background: {
      DEFAULT: '#0B1220',
      light: '#1E293B',
      dark: '#050A12',
    },
    secondary: {
      DEFAULT: '#1E293B',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    accent: {
      DEFAULT: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
      muted: '#64748B',
    },
    status: {
      success: '#05A146',
      warning: '#FFA726',
      error: '#ef4444',
      info: '#3B82F6',
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

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    card: '0 8px 24px rgba(0, 0, 0, 0.25)',
    primary: '0 4px 12px rgba(5, 161, 70, 0.3)',
    glow: '0 0 20px rgba(5, 161, 70, 0.5)',
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
