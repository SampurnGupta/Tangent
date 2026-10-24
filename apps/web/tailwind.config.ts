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
        background: "var(--bg-main)",
        foreground: "var(--text-main)",
        charcoal: "#191B1D",
        canvas: "#F4F5F6",
        surface: "#FFFFFF",
        "surface-subtle": "#EAEBED",
        "surface-hover": "#F8F9FA",
        "border-hairline": "#CDCECF",
        "border-charcoal": "#191B1D",
        "text-charcoal": "#191B1D",
        "text-muted": "#5A5D61",
        "text-subtle": "#85888C",
        "finance-green": "#0F766E",
        "finance-amber": "#B45309",
        "finance-red": "#B91C1C",
        plum: "#6D0E5A",
        "plum-hover": "#580B48",
        "plum-light": "#F7EBF4",
        "plum-subtle": "rgba(109, 14, 90, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
