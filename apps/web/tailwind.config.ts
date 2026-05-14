import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#000000",
          surface: "#0A0A0B",
          elevated: "#15151A",
          overlay: "#1F1F26",
          input: "#0D0D10",
        },
        line: {
          subtle: "#1F1F24",
          DEFAULT: "#27272A",
          strong: "#3F3F46",
          divider: "#15151A",
        },
        ink: {
          primary: "#F5F5F7",
          secondary: "#A1A1AA",
          tertiary: "#71717A",
          muted: "#52525B",
        },
        accent: {
          DEFAULT: "#DC2626",
          hover: "#EF4444",
        },
        success: "#22C55E",
        danger: "#DC2626",
        warning: "#F59E0B",
        info: "#3B82F6",
        chart: {
          up: "#26A69A",
          down: "#EF5350",
          vah: "#2962FF",
          poc: "#F44336",
          lvn: "#FF9800",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightish: "-0.01em",
        tight2: "-0.02em",
      },
      borderRadius: {
        DEFAULT: "6px",
        card: "8px",
      },
      boxShadow: {
        glow: "0 0 0 4px rgba(220, 38, 38, 0.15)",
        ring: "0 0 0 3px rgba(220, 38, 38, 0.15)",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        pulseDot: "pulseDot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
