import type { Config } from "tailwindcss";

/**
 * Soul Blueprint — design system
 *
 * Palette: warm parchment / bone backgrounds, ink text, restrained
 * accents (deep fig + tarnished gold hairline). Typography pairs a
 * literary serif (Fraunces) with a quiet sans (Inter).
 *
 * Color tokens are wired to CSS variables (see globals.css) so a future
 * theme or dark mode can be introduced without touching components.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,md,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: "var(--color-bone)",
        parchment: "var(--color-parchment)",
        stone: "var(--color-stone)",
        sand: "var(--color-sand)",
        ink: "var(--color-ink)",
        charcoal: "var(--color-charcoal)",
        taupe: "var(--color-taupe)",
        fig: "var(--color-fig)",
        gold: "var(--color-gold)",
        line: "var(--color-line)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Editorial type scale
        "display-lg": ["clamp(2.75rem, 6vw, 5.25rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        display: ["clamp(2.25rem, 4.5vw, 3.75rem)", { lineHeight: "1.05", letterSpacing: "-0.018em" }],
        h1: ["clamp(2rem, 3.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        h2: ["clamp(1.6rem, 2.6vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        h3: ["clamp(1.3rem, 1.8vw, 1.6rem)", { lineHeight: "1.2", letterSpacing: "-0.008em" }],
        lede: ["clamp(1.15rem, 1.6vw, 1.4rem)", { lineHeight: "1.55", letterSpacing: "-0.005em" }],
        body: ["1.0625rem", { lineHeight: "1.7" }],
        "read": ["1.1875rem", { lineHeight: "1.75" }],
        meta: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.04em" }],
        micro: ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.14em" }],
      },
      maxWidth: {
        container: "78rem",
        prose: "42rem",
        narrow: "34rem",
      },
      spacing: {
        section: "clamp(4rem, 9vw, 8.5rem)",
        "section-sm": "clamp(3rem, 6vw, 5rem)",
      },
      letterSpacing: {
        label: "0.14em",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
