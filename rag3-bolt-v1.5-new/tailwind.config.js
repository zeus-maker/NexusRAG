/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#030712',
          900: '#0a0f1e',
          800: '#111827',
          700: '#1a2236',
          600: '#243049',
          500: '#2d3f5e',
        },
        neon: {
          cyan: '#00f0ff',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          green: '#10b981',
          orange: '#f59e0b',
          pink: '#ec4899',
        },
        glass: {
          light: 'rgba(255,255,255,0.06)',
          medium: 'rgba(255,255,255,0.1)',
          heavy: 'rgba(255,255,255,0.15)',
          border: 'rgba(255,255,255,0.08)',
          borderHover: 'rgba(255,255,255,0.2)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'dot-pattern': 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
        'glow-cyan': 'radial-gradient(ellipse at center, rgba(0,240,255,0.15) 0%, transparent 70%)',
        'glow-blue': 'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
        'glow-green': 'radial-gradient(ellipse at center, rgba(16,185,129,0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
        'dots': '20px 20px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'typing': 'typing 1.5s steps(3) infinite',
        'scan-line': 'scanLine 4s linear infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'counter': 'counter 1s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        slideUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(-10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%': { opacity: '0.2' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.2' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(0,240,255,0.1)' },
          '50%': { borderColor: 'rgba(0,240,255,0.4)' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0,240,255,0.3), 0 0 45px rgba(0,240,255,0.1)',
        'neon-blue': '0 0 15px rgba(59,130,246,0.3), 0 0 45px rgba(59,130,246,0.1)',
        'neon-green': '0 0 15px rgba(16,185,129,0.3), 0 0 45px rgba(16,185,129,0.1)',
        'neon-orange': '0 0 15px rgba(245,158,11,0.3), 0 0 45px rgba(245,158,11,0.1)',
        'glow': '0 0 20px rgba(0,240,255,0.15)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
