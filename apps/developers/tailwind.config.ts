import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
