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
        primary: '#00E38C',
        secondary: '#00C2FF',
        dark: '#050816',
        muted: '#A0AEC0',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'slide-down': 'slideDown 0.2s ease forwards',
        'slide-left': 'slideInLeft 0.3s ease forwards',
        'slide-right': 'slideInRight 0.3s ease forwards',
        'bounce-dot': 'bounce 1.2s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'aurora-1': 'auroraBlob1 18s ease-in-out infinite',
        'aurora-2': 'auroraBlob2 24s ease-in-out infinite',
        'aurora-3': 'auroraBlob3 20s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-green': '0 0 30px rgba(0, 227, 140, 0.3)',
        'glow-blue': '0 0 30px rgba(0, 194, 255, 0.3)',
        'glow-sm': '0 0 15px rgba(0, 227, 140, 0.2)',
      },
    },
  },
  plugins: [],
};
export default config;
