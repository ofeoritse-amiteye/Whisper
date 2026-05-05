import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#09090b',
        sidebar: '#0c0c0f',
        thread: '#0a0a0d',
        surface: '#18181c',
        surfaceHover: 'rgb(255 255 255 / 0.06)',
        accent: '#7c5cfc',
        border: 'rgb(255 255 255 / 0.1)',
        muted: '#a1a1aa',
        placeholder: '#71717a',
        success: '#4ade80',
        danger: '#f87171',
      },
    },
  },
} satisfies Config
