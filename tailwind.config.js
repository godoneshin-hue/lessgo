/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm paper + ember system: momentum/energy over the generic
        // "friendly SaaS blue," and warm neutrals over cold blue-grays.
        bg: '#F5F2EA',
        surface: '#FFFFFF',
        ink: '#1C1815',
        'ink-soft': '#645C50',
        'ink-faint': '#9C9385',
        primary: '#D5451B',
        'primary-light': '#E67A4C',
        'primary-ink': '#A6350F',
        'primary-deep': '#7A2508',
        'primary-tint': '#FBE4D8',
        success: '#1F7A4D',
        'success-text': '#145536',
        'success-tint': '#DFEEE3',
        warn: '#C23B3B',
        'warn-text': '#8A2323',
        'warn-tint': '#F7DEDD',
        gold: '#B8860B',
        'gold-ink': '#6B4E0A',
        'gold-tint': '#F3E6C4',
        line: '#E4DDD0',
      },
      fontFamily: {
        display: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
        body: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
      },
      fontSize: {
        // A deliberate scale (size + line-height + tracking) so headings
        // read as a hierarchy rather than ad-hoc text-xl/2xl bumps.
        xs: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        sm: ['0.8125rem', { lineHeight: '1.5' }],
        base: ['0.9375rem', { lineHeight: '1.6' }],
        lg: ['1.0625rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        '3xl': ['1.9rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '4xl': ['2.4rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        card: '0 10px 28px -16px rgba(28, 24, 21, 0.22)',
        pop: '0 16px 32px -16px rgba(213, 69, 27, 0.32)',
        glow: '0 22px 44px -16px rgba(122, 37, 8, 0.45)',
        ring: '0 12px 26px -12px rgba(166, 53, 15, 0.35)',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '20px',
        '3xl': '20px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #E67A4C 0%, #D5451B 55%, #7A2508 100%)',
        'gradient-primary-soft': 'linear-gradient(135deg, #E67A4C 0%, #A6350F 100%)',
      },
    },
  },
  plugins: [],
}
