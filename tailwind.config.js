/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F2F7FF',
        surface: '#FFFFFF',
        ink: '#14213D',
        'ink-soft': '#5B6B8C',
        'ink-faint': '#93A1BE',
        primary: '#2F7BFF',
        'primary-light': '#63A4FF',
        'primary-ink': '#1C56C7',
        'primary-deep': '#123E96',
        'primary-tint': '#DCEBFF',
        success: '#0CA30C',
        'success-text': '#006300',
        'success-tint': '#E1F7E1',
        warn: '#EC835A',
        'warn-text': '#B84B26',
        'warn-tint': '#FDE8DE',
        gold: '#F2B134',
        'gold-ink': '#8A5A00',
        'gold-tint': '#FDF0D5',
        line: '#E3EAF7',
      },
      fontFamily: {
        display: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
        body: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -14px rgba(20, 33, 61, 0.18)',
        pop: '0 16px 36px -14px rgba(47, 123, 255, 0.35)',
        glow: '0 22px 48px -14px rgba(28, 86, 199, 0.55)',
        ring: '0 12px 28px -10px rgba(28, 86, 199, 0.4)',
      },
      borderRadius: {
        xl2: '20px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #63A4FF 0%, #2F7BFF 45%, #123E96 100%)',
        'gradient-primary-soft': 'linear-gradient(135deg, #4F8FFF 0%, #1C56C7 100%)',
      },
    },
  },
  plugins: [],
}
