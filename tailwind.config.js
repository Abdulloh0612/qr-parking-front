/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        /* Mapped from CSS variables — use sparingly, prefer var() */
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0070f3',
          700: '#005fd4',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      /* Clean elevation via borders, not shadows */
      boxShadow: {
        'none': 'none',
        /* Only used where absolutely necessary */
        'lift': '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        'sheet': '0 -1px 0 0 #eaeaea, 0 -8px 32px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':  'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow':'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:  { '0%': { transform: 'scale(0.96)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        bounceIn: { '0%': { transform: 'scale(0.85)', opacity: '0' }, '60%': { transform: 'scale(1.04)', opacity: '1' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      transitionDuration: { DEFAULT: '150ms', '200': '200ms' },
      transitionTimingFunction: { DEFAULT: 'ease', 'out': 'ease-out' },
    },
  },
  plugins: [],
}
