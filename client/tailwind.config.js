/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Infinite Clinical Intelligence palette (matches the Stitch designs)
        primary: {
          DEFAULT: '#003c90',
          container: '#0f52ba',
          fixed: '#d9e2ff',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#bcceff',
        // Medical Teal — reserved for State / National benchmark accents
        secondary: {
          DEFAULT: '#006a61',
          container: '#86f2e4',
        },
        'on-secondary-container': '#006f66',
        surface: {
          DEFAULT: '#f8f9ff',
          bright: '#f8f9ff',
          lowest: '#ffffff',
          low: '#eff4ff',
          container: '#e5eeff',
          high: '#dce9ff',
          highest: '#d3e4fe',
        },
        ink: '#0b1c30',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#434653',
        outline: {
          DEFAULT: '#737784',
          variant: '#c3c6d5',
        },
        zebra: '#f1f5f9',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        good: '#15803d',
        bad: '#b91c1c',
        amber: { soft: '#fef3c7', deep: '#92400e' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      maxWidth: {
        report: '816px',
        shell: '1440px',
      },
      boxShadow: {
        canvas: '0 4px 20px -2px rgba(0, 60, 144, 0.08)',
        card: '0 1px 2px rgba(16,40,90,.04)',
      },
      letterSpacing: {
        label: '0.05em',
      },
    },
  },
  plugins: [],
};
