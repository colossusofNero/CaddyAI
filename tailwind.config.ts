import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CaddyAI Brand Colors (matching React Native app)
        primary: {
          DEFAULT: '#05A146',
          50: '#e6f7ed',
          100: '#ccefdb',
          200: '#99dfb7',
          300: '#66cf93',
          400: '#33bf6f',
          500: '#05A146', // Main green
          600: '#048138',
          700: '#03612a',
          800: '#02401c',
          900: '#01200e',
        },
        background: {
          DEFAULT: '#0B1220', // Dark blue background
          light: '#1E293B',   // Lighter variant
        },
        secondary: {
          DEFAULT: '#1E293B', // Slate
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
          DEFAULT: '#3B82F6', // Blue accent
          light: '#60A5FA',
          dark: '#2563EB',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        success: '#05A146',
        warning: '#FFA726',
        error: '#ef4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 8px 24px rgba(0, 0, 0, 0.25)',
        'primary': '0 4px 12px rgba(5, 161, 70, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
