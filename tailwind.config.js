/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D13',
        surface: '#131722',
        surfaceSecondary: '#1C2230',
        surfaceHover: '#242C3E',
        border: 'rgba(255, 255, 255, 0.08)',
        borderHighlight: 'rgba(255, 136, 0, 0.4)',
        primary: '#F8FAFC',
        secondary: '#94A3B8',
        muted: '#64748B',
        accent: '#FF7A00', // Vibrant friendly orange
        accentGlow: 'rgba(255, 122, 0, 0.25)',
        emerald: '#10B981',
        sky: '#38BDF8',
        violet: '#A855F7',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(255, 122, 0, 0.3)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
