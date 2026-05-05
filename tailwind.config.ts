import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#1a1a1a',
        sidebar: '#242424',
        thread: '#1e1e1e',
        surface: '#2a2a2a',
        surfaceHover: '#333333',
        accent: '#7c5cfc',
        border: '#333333',
        muted: '#a0a0a0',
        placeholder: '#666666',
        success: '#4ade80',
        danger: '#f87171',
      },
    },
  },
} satisfies Config
