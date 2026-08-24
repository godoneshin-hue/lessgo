/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F2EA',
        surface: '#FFFFFF',
        ink: '#1C1815',
        'ink-soft': '#645C50',
        // Was #9C9385 — only ~3:1 against white (fails WCAG AA for the small
        // 9–11px labels/timestamps this token is used for almost everywhere).
        'ink-faint': '#736A59',
        primary: '#2F86F0',
        'primary-light': '#6EC1F5',
        'primary-ink': '#1E63C9',
        'primary-deep': '#123E96',
        'primary-tint': '#DCEEFB',
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
        pop: '0 16px 32px -16px rgba(47, 134, 240, 0.32)',
        glow: '0 22px 44px -16px rgba(18, 62, 150, 0.45)',
        ring: '0 12px 26px -12px rgba(30, 99, 201, 0.35)',
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
        'gradient-primary': 'linear-gradient(135deg, #6EC1F5 0%, #2F86F0 55%, #123E96 100%)',
        'gradient-primary-soft': 'linear-gradient(135deg, #6EC1F5 0%, #1E63C9 100%)',
      },
    },
  },
  plugins: [],
}