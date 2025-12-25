// ============================================================================
// COPPERLINE GOLF - Tailwind CSS Configuration
// ============================================================================
// This file replaces web-app/tailwind.config.ts in your Next.js project
// Primary: Copper (#B87333) | Secondary: Turquoise (#40C4D3) | Accent: Green (#4A9E5B)
// ============================================================================

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // =====================================================================
        // PRIMARY - Copper Spectrum
        // Use: Primary buttons, headers, brand elements, recommendations
        // =====================================================================
        copper: {
          50: '#FDF8F3',
          100: '#F5E6D8',
          200: '#E8C9AD',
          300: '#D4956A',
          400: '#C9956C',
          500: '#B87333', // PRIMARY - Main brand color
          600: '#A05E28',
          700: '#8B4513', // Dark variant for pressed states
          800: '#6B3410',
          900: '#4A240B',
        },
        
        // =====================================================================
        // SECONDARY - Turquoise Blue
        // Use: Secondary buttons, links, water hazards, info states
        // =====================================================================
        turquoise: {
          50: '#F0FAFB',
          100: '#D6F2F5',
          200: '#AEE5EB',
          300: '#7DD8E4',
          400: '#5ACEDD',
          500: '#40C4D3', // SECONDARY - Main accent color
          600: '#2A9BA8',
          700: '#1F7580',
          800: '#165158',
          900: '#0D3238',
        },
        
        // =====================================================================
        // ACCENT - Golf Greens
        // Use: Success states, fairway visualization, positive actions
        // =====================================================================
        fairway: {
          50: '#F0F9F2',
          100: '#DCF0E0',
          200: '#BBE2C4',
          300: '#8FCC9C',
          400: '#7BC775',
          500: '#4A9E5B', // Fairway green
          600: '#3D8A4E',
          700: '#2D7A47', // Forest green
          800: '#285F3C',
          900: '#214D32',
        },
        
        // =====================================================================
        // SEMANTIC COLORS
        // =====================================================================
        brand: {
          primary: '#B87333',
          secondary: '#40C4D3',
          accent: '#4A9E5B',
        },
        
        success: {
          50: '#F0F9F2',
          100: '#DCF0E0',
          500: '#4A9E5B',
          600: '#3D8A4E',
          700: '#2D7A47',
        },
        
        warning: {
          50: '#FFFBF0',
          100: '#FEF3D6',
          500: '#E4A853',
          600: '#CC8E3D',
          700: '#B37A2D',
        },
        
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#DC4444',
          600: '#C53030',
          700: '#9B2C2C',
        },
        
        info: {
          50: '#F0FAFB',
          100: '#D6F2F5',
          500: '#40C4D3',
          600: '#2A9BA8',
          700: '#1F7580',
        },
        
        // =====================================================================
        // GOLF-SPECIFIC COLORS
        // =====================================================================
        golf: {
          fairway: '#4A9E5B',
          green: '#7BC775',
          rough: '#2D7A47',
          water: '#40C4D3',
          bunker: '#E4A853',
          trees: '#2D7A47',
          ob: '#DC4444',
        },
        
        // =====================================================================
        // NEUTRAL SCALE (Warm tint)
        // =====================================================================
        neutral: {
          50: '#FAFAF8',
          100: '#F5F0EB',
          200: '#E5DDD5',
          300: '#D4C4B5',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#1A1A1A',
        },
      },
      
      // Background colors
      backgroundColor: {
        'warm': '#FDF8F3',
        'warm-secondary': '#F5F0EB',
      },
      
      // Box shadow with copper tint
      boxShadow: {
        'copper': '0 4px 14px 0 rgba(184, 115, 51, 0.25)',
        'copper-lg': '0 10px 30px 0 rgba(184, 115, 51, 0.3)',
        'turquoise': '0 4px 14px 0 rgba(64, 196, 211, 0.25)',
      },
      
      // Ring colors for focus states
      ringColor: {
        'copper': '#B87333',
        'turquoise': '#40C4D3',
      },
      
      // Border colors
      borderColor: {
        'warm': '#E5DDD5',
        'warm-dark': '#D4C4B5',
      },
      
      // Gradients via background image
      backgroundImage: {
        'gradient-copper': 'linear-gradient(135deg, #D4956A 0%, #B87333 50%, #8B4513 100%)',
        'gradient-turquoise': 'linear-gradient(135deg, #7DD8E4 0%, #40C4D3 50%, #2A9BA8 100%)',
        'gradient-fairway': 'linear-gradient(135deg, #7BC775 0%, #4A9E5B 50%, #2D7A47 100%)',
        'gradient-warm-bg': 'linear-gradient(180deg, #FFFFFF 0%, #FDF8F3 100%)',
      },
      
      // Font family
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // Animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-copper': 'pulseCopper 2s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseCopper: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184, 115, 51, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(184, 115, 51, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
