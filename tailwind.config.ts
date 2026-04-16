import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        tint:       '#10B981',
        'tint-dark': '#34d399',
        'tint-muted': '#d1fae5',
      },
    },
  },
  plugins: [],
} satisfies Config;
