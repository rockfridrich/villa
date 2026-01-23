/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FFFDF8",
          50: "#FFFEF9",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#6B7280",
        },
        accent: {
          yellow: "#FFD700",
        },
      },
      animation: {
        'progress': 'progress 1s ease-in-out infinite',
        'in': 'in 0.2s ease-out',
        'slide-in-from-bottom-5': 'slide-in-from-bottom 0.3s ease-out',
      },
      keyframes: {
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        in: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-from-bottom': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
