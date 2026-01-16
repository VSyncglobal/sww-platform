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
        sacco: {
          blue: '#1e3a8a',  // Rich Navy Blue (Primary)
          gold: '#d97706',  // Deep Amber/Gold (Accent)
          dark: '#0f172a',  // Nearly Black (Text)
        }
      },
    },
  },
  plugins: [],
};
export default config;