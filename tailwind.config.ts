import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light theme — Monday/Linear inspired
        bg: {
          0: "#f6f7fb",        // page background — soft gray-blue
          1: "#ffffff",        // surface (cards, sidebar)
          2: "#f0f1f7",        // raised / hover
          3: "#e9ebf3",        // input / chip
          4: "#dfe2ec",        // stronger hover
        },
        line: {
          DEFAULT: "#e5e7eb",  // dividers
          strong: "#cdd1dc",
        },
        ink: {
          0: "#181923",        // primary text
          1: "#52525c",        // secondary
          2: "#78788a",        // muted
          3: "#a5a7b3",        // disabled
        },
        accent: {
          DEFAULT: "#7c5cff",  // brand purple
          hover: "#6b48f0",
          muted: "#5b3fd1",
          glow: "#7c5cff33",
        },
        success: "#16a34a",
        warn: "#d97706",
        danger: "#dc2626",
        info: "#2563eb",
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
        card: "0 1px 2px rgba(15, 17, 26, 0.05), 0 0 0 1px rgba(15, 17, 26, 0.04)",
        glow: "0 0 0 1px rgba(124,92,255,0.35), 0 6px 16px -4px rgba(124,92,255,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
