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
        // CaddyAI Brand Colors - REDESIGNED (Level 1 Design System)
        primary: {
          DEFAULT: '#1B5E20', // Deep forest green - premium brand color
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#1B5E20', // Main brand color
          600: '#164E1A',
          700: '#113E14',
          800: '#0C2E0E',
          900: '#061F07',
        },
        secondary: {
          DEFAULT: '#76FF03', // Vibrant tech green - energy & innovation
          50: '#F1F8E9',
          100: '#DCEDC8',
          200: '#C5E1A5',
          300: '#AED581',
          400: '#9CCC65',
          500: '#76FF03', // High-energy accent
          600: '#64DD17',
          700: '#558B2F',
          800: '#33691E',
          900: '#1B5E20',
        },
        accent: {
          DEFAULT: '#2196F3', // Sky blue - clarity & intelligence
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3', // Main accent
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        neutral: {
          DEFAULT: '#607D8B', // Warm gray for text
          50: '#FAFAFA', // Off-white background
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#607D8B', // Body text
          800: '#455A64', // Headings
          900: '#263238', // Dark text
        },
        background: {
          DEFAULT: '#FAFAFA', // Light mode - off-white
          light: '#FFFFFF',   // Pure white for cards
          dark: '#0B1220',    // Dark mode option
          'dark-light': '#1E293B',
        },
        text: {
          primary: '#263238',  // Dark charcoal for headings
          secondary: '#607D8B', // Body text gray
          muted: '#9E9E9E',    // Muted gray
        },
        gold: {
          DEFAULT: '#FFC107', // Premium features
          400: '#FFD54F',
          500: '#FFC107',
          600: '#FFB300',
        },
        success: '#D32F2F', // Golf flag red
        warning: '#FFA726',
        error: '#F44336',
        info: '#2196F3',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        // Design System Fonts
        heading: ['Inter', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        body: ['Open Sans', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
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
