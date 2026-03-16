import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        input: "var(--bg-input)",
        primary: "var(--fg-primary)",
        muted: "var(--fg-muted)",
        subtle: "var(--fg-subtle)",
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
          on: "var(--accent-on)",
        },
        accent2: {
          DEFAULT: "var(--accent2)",
          dim: "var(--accent2-dim)",
        },
        positive: {
          DEFAULT: "var(--positive)",
          dim: "var(--positive-dim)",
        },
        negative: {
          DEFAULT: "var(--negative)",
          dim: "var(--negative-dim)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          dim: "var(--warning-dim)",
        },
        border: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        }
      },
    },
  },
  plugins: [],
}
export default config
