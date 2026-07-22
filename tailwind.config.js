/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        foreground: '#ffffff',
        zinc: {
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        accent: {
          blue: '#3b82f6',
          orange: '#f97316',
        },
      },
      fontFamily: {
        'urbanist-black': ['var(--font-urbanist-black)'],
        'urbanist-bold': ['var(--font-urbanist-bold)'],
        'bacalisties': ['var(--font-bacalisties)'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'blue-orange': 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
        'blue-orange-dark': 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%)',
      },
      boxShadow: {
        'curtain': '0 -50px 100px rgba(0, 0, 0, 0.8)',
        'glow-blue': '0 0 60px rgba(59, 130, 246, 0.3)',
        'glow-orange': '0 0 60px rgba(249, 115, 22, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
