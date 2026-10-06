/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#131314',
        'on-background': '#E5E2E3',
        surface: {
          DEFAULT: '#101112',
          panel: '#101112',
          telemetry: '#151617',
          card: '#101112',
        },
        border: {
          DEFAULT: '#232426',
          divider: '#1B1C1E',
          boundary: '#232426',
        },
        primary: {
          DEFAULT: '#5E6BFF',
          hover: '#4D5AE5',
        },
        secondary: {
          DEFAULT: '#50D8E9',
        },
        tertiary: {
          DEFAULT: '#FFB689',
          violet: '#7A85FF',
          peach: '#FFB689',
        },
        safe: '#10B981',
        warning: '#F59E0B',
        danger: {
          DEFAULT: '#EF4444',
          light: '#FFB4AB',
        },
        textMuted: '#8F8FA1',
        textSecondary: '#C6C5D8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        h1: ['Manrope', 'sans-serif'],
        'mono-data': ['Inter', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
      },
    },
  },
  plugins: [],
};
