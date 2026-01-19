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
          blue: '#1e3a8a',    // Rich Navy (Primary)
          gold: '#f59e0b',    // Bright Gold (Highlights)
          orange: '#ea580c',  // Warm Orange (Action Buttons)
          cream: '#fffbeb',   // Warm White (Backgrounds)
          dark: '#0f172a',    // Slate 900 (Text)
        }
      },
      fontSize: {
        'base': '1.05rem',    // Boost default reading size
        'lg': '1.15rem',
      },
      screens: {
        'xs': '475px',        // Extra small mobile breakpoint
      }
    },
  },
  plugins: [],
};
export default config;