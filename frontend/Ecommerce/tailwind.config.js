/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--lux-ink)',
        espresso: 'var(--lux-espresso)',
        graphite: 'var(--lux-graphite)',
        stone: 'var(--lux-stone)',
        fog: 'var(--lux-fog)',
        ivory: 'var(--lux-ivory)',
        cream: 'var(--lux-cream)',
        porcelain: 'var(--lux-porcelain)',
        champagne: {
          DEFAULT: 'var(--lux-champagne)',
          deep: 'var(--lux-champagne-deep)',
          soft: 'var(--lux-champagne-soft)',
        },
        lux: {
          success: 'var(--lux-success)',
          warning: 'var(--lux-warning)',
          danger: 'var(--lux-danger)',
          info: 'var(--lux-info)',
        },
        primary: {
          50: 'var(--lux-cream)',
          100: 'var(--lux-ivory)',
          500: 'var(--lux-ink)',
          600: 'var(--lux-espresso)',
          700: 'var(--lux-ink)',
          900: 'var(--lux-ink)',
        },
        neutral: {
          50: 'var(--lux-cream)',
          100: 'var(--lux-ivory)',
          200: 'var(--lux-fog)',
          300: '#C4BDB0',
          400: 'var(--lux-stone)',
          500: 'var(--lux-stone)',
          600: 'var(--lux-graphite)',
          700: 'var(--lux-graphite)',
          800: 'var(--lux-espresso)',
          900: 'var(--lux-ink)',
        },
      },
      fontFamily: {
        sans: ['var(--lux-font-sans)'],
        serif: ['var(--lux-font-serif)'],
      },
      borderRadius: {
        lux: 'var(--lux-radius-md)',
        'lux-sm': 'var(--lux-radius-sm)',
        'lux-lg': 'var(--lux-radius-lg)',
      },
      boxShadow: {
        'lux-sm': 'var(--lux-shadow-sm)',
        'lux-md': 'var(--lux-shadow-md)',
        'lux-lg': 'var(--lux-shadow-lg)',
      },
      transitionTimingFunction: {
        lux: 'var(--lux-ease)',
      },
      transitionDuration: {
        lux: '280ms',
        'lux-slow': '420ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.42s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-up': 'slideUp 0.42s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-in-right': 'slideInRight 0.42s cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
