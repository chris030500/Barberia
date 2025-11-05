import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)',
        surface: 'var(--color-surface)'
      }
    },
  },
  plugins: [],
} satisfies Config
