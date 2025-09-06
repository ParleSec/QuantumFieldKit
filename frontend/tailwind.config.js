/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './build/index.html',
  ],
  safelist: [
    'dark',
    'dark:bg-neutral-800',
    'dark:text-neutral-100',
    'dark:text-neutral-200',
    'dark:text-neutral-300',
    'dark:border-neutral-500',
    'dark:border-neutral-600',
    'dark:placeholder-neutral-300',
    'dark:bg-neutral-600',
    'dark:bg-neutral-700',
    'dark:hover:bg-neutral-500',
    'dark:hover:bg-neutral-600',
    'dark:hover:text-neutral-100',
    'dark:hover:text-neutral-200',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'],
      },
      colors: {
        brand: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        quantumlight: {
          primary: '#6366f1',
          secondary: '#22d3ee',
          accent: '#f472b6',
          neutral: '#1f2937',
          'base-100': '#ffffff',
        },
      },
      'dark',
      'forest',
      'synthwave',
    ],
  },
};


