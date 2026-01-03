import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Proof of Retreat design system
        cream: {
          50: '#fffcf8',
          100: '#fef9f0',
          200: '#fdf3e0',
        },
        ink: {
          DEFAULT: '#0d0d17',
          light: '#45454f',
          muted: '#61616b',
        },
        accent: {
          yellow: '#ffe047',
          green: '#698f69',
          brown: '#382207',
        },
        neutral: {
          50: '#f1f1f4',
          100: '#e0e0e6',
          200: '#c4c4cc',
        },
        // Keep villa for backwards compatibility
        villa: {
          500: '#ffe047', // Now yellow accent
          600: '#f5d63d',
          700: '#e6c733',
        },
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
      },
    },
  },
  plugins: [],
}

export default config
