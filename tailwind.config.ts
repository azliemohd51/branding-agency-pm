import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Figma-inspired dark palette
        bg: {
          0: "#0c0c0e",        // deepest background
          1: "#141417",        // surface
          2: "#1a1a1f",        // raised surface
          3: "#232329",        // card / input
          4: "#2c2c34",        // hover
        },
        line: {
          DEFAULT: "#2a2a31",  // dividers
          strong: "#3a3a44",
        },
        ink: {
          0: "#f4f4f6",        // primary text
          1: "#b5b5be",        // secondary
          2: "#71717a",        // muted
          3: "#52525b",        // disabled
        },
        accent: {
          DEFAULT: "#7c5cff",  // brand purple
          hover: "#8e72ff",
          muted: "#5b3fd1",
          glow: "#7c5cff33",
        },
        success: "#22c55e",
        warn: "#f59e0b",
        danger: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        md: "8px",
        lg: "10px",
        xl: "14px",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(124,92,255,0.4), 0 0 24px rgba(124,92,255,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
