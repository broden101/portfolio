import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#effbf5", 100: "#d9f5e6", 200: "#b6ebd0", 300: "#85dab2",
          400: "#4dbf8f", 500: "#2f9d70", 600: "#3f9e74", 700: "#2f7d5c",
          800: "#173f2e", 900: "#0f2b1f"
        },
        lime: "#d0ff00",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      }
    }
  },
  plugins: []
};
export default config;