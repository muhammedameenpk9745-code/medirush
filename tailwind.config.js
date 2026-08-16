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
        medirush: {
          primary: '#16B67A',
          secondary: '#0F8F68',
          dark: '#0B2540',
          bg: '#F7FAF9',
          light: '#E8F8F1',
          border: '#E2EAE6',
        },
        brand: {
          50: '#E8F8F1',
          100: '#dcfce7',
          200: '#E2EAE6',
          300: '#86efac',
          400: '#4ade80',
          500: '#16B67A', // Primary MediRush Green
          600: '#0F8F68', // Secondary Deep Green
          700: '#047857',
          800: '#0B2540', // Dark Navy Accent
          900: '#064e3b',
          950: '#022c22',
        },
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#334e68',
          800: '#102a43',
          900: '#0B2540',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(11, 37, 64, 0.04), 0 1px 2px rgba(11, 37, 64, 0.02)',
        'soft-md': '0 4px 14px rgba(11, 37, 64, 0.06), 0 1px 3px rgba(11, 37, 64, 0.03)',
        'soft-lg': '0 10px 30px -3px rgba(11, 37, 64, 0.08), 0 4px 8px -2px rgba(11, 37, 64, 0.04)',
        'card-hover': '0 14px 32px -4px rgba(22, 182, 122, 0.18), 0 4px 12px rgba(11, 37, 64, 0.05)',
        'glow-emerald': '0 0 25px rgba(22, 182, 122, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0B2540 0%, #064e3b 45%, #0F8F68 80%, #16B67A 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(232,248,241,0.9) 100%)',
        'subtle-green': 'linear-gradient(180deg, #E8F8F1 0%, #F7FAF9 100%)',
      },
    },
  },
  plugins: [],
}
