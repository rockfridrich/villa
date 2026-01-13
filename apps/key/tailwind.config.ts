import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FFFDF7",
          100: "#FFF9E8",
          200: "#FFF3D4",
        },
        ink: {
          DEFAULT: "#1F1F1F",
          muted: "#6B6B6B",
          light: "#8B8B8B",
        },
        accent: {
          yellow: "#FFE566",
          brown: "#5C4B32",
          green: "#4ADE80",
        },
        villa: {
          500: "#F5D547",
          600: "#E5C537",
          700: "#D5B527",
        },
        error: {
          text: "#DC2626",
          bg: "#FEF2F2",
          border: "#FECACA",
        },
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans: ["system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
