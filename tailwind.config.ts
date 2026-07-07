import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "80rem",
      },
    },
    fontFamily: {
      display: ["var(--font-display)", "system-ui", "sans-serif"],
      sans: ["var(--font-body)", "system-ui", "sans-serif"],
      mono: ["var(--font-mono)", "monospace"],
    },
    extend: {
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 2px 12px -2px rgba(13, 27, 42, 0.12), 0 10px 28px -12px rgba(13, 27, 42, 0.18)",
        "card-hover": "0 10px 32px -6px rgba(13, 27, 42, 0.2), 0 18px 44px -14px rgba(13, 27, 42, 0.16)",
        header: "0 4px 24px -4px rgba(13, 27, 42, 0.2)",
      },
      colors: {
        "forge-950": "#0D1B2A",
        "iron-800": "#1A3148",
        "surface-cream": "#E7E8E1",
        "surface-muted": "#DDE2DC",
        primary: {
          50: "#F0F4F8",
          100: "#DCE8F2",
          200: "#b6c4d0",
          300: "#7f95a8",
          400: "#45637A",
          500: "#3d5568",
          600: "#2d455a",
          700: "#1A3148",
          800: "#0f2436",
          900: "#0D1B2A",
          DEFAULT: "#1A3148",
          foreground: "#FFFFFF",
        },
        accent: {
          50: "#FFF5F0",
          100: "#FFE5D9",
          200: "#FFC4B3",
          300: "#FFA08C",
          400: "#FF7859",
          500: "#FF5026",
          600: "#E64400",
          700: "#CC5500",
          800: "#993D00",
          900: "#662900",
          DEFAULT: "#CC5500",
          foreground: "#FFFFFF",
        },
        steel: {
          50: "#f7f9fb",
          100: "#edf2f7",
          200: "#d7e0e8",
          300: "#b6c4d0",
          400: "#7f95a8",
          500: "#45637A",
          600: "#3d5568",
          700: "#2d455a",
          800: "#1a3148",
          900: "#0f2436",
        },
        "blueprint-100": "#DCE8F2",
        "safety-orange": "#CC5500",
        "alloy-white": "#F4F2EA",
      },
    },
  },
  plugins: [],
};

export default config;
