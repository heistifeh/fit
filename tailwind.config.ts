import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tint:       '#10B981',
        'tint-dark': '#34d399',
        'tint-muted': '#d1fae5',
      },
      screens: {
        xs: '375px', // iPhone SE
      },
      height: {
        dvh: '100dvh',
      },
      minHeight: {
        dvh: '100dvh',
      },
    },
  },
  plugins: [],
} satisfies Config;
