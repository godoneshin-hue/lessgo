/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rebrand off the generic "cream + SaaS blue" pair (this exact
        // combination is one of the most common tells for an AI-templated
        // look) toward a warm coral/tangerine identity that actually fits a
        // teen challenge app — more energy, less corporate dashboard.
        bg: '#FBF3EF',
        surface: '#FFFFFF',
        ink: '#2A1810',
        'ink-soft': '#6E5148',
        'ink-faint': '#7C6259',
        primary: '#FF7A1F',
        'primary-light': '#FFA05C',
        'primary-ink': '#A84A0A',
        'primary-deep': '#7A3505',
        'primary-tint': '#FFE8D6',
        success: '#1F7A4D',
        'success-text': '#155A3A',
        'success-tint': '#DFEEE3',
        warn: '#C23B3B',
        'warn-text': '#8A2323',
        'warn-tint': '#F7DEDD',
        gold: '#B8860B',
        'gold-ink': '#6B4E0A',
        'gold-tint': '#F3E6C4',
        line: '#E8DED2',
      },
      fontFamily: {
        // Pretendard is the only Hangul-complete family already shipping
        // (loading a second full Korean webface just for headings would add
        // several hundred KB) — display is differentiated by weight/tracking
        // instead of a second typeface: always Black/ExtraBold and always
        // tighter tracking, never "the same paragraph font, just bigger."
        display: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
        body: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'sans-serif'],
      },
      fontSize: {
        // Fluid via CSS clamp(), scaled against the app shell's own width
        // (cqw = 1% of the nearest container, see .app-shell in index.css)
        // rather than the viewport — this app is a fixed-width phone-shaped
        // card even on desktop, so vw-based fluid type would blow up at
        // wide window sizes. Range is deliberately subtle (the shell only
        // ever spans ~360–430px), tapering size down on the narrowest real
        // phones instead of every screen using one flat px number.
        xs: ['clamp(0.7188rem, 0.558rem + 0.0446cqw, 0.75rem)', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        sm: ['clamp(0.7813rem, 0.6205rem + 0.0446cqw, 0.8125rem)', { lineHeight: '1.5' }],
        base: ['clamp(0.9063rem, 0.7455rem + 0.0446cqw, 0.9375rem)', { lineHeight: '1.6' }],
        lg: ['clamp(1rem, 0.6786rem + 0.0893cqw, 1.0625rem)', { lineHeight: '1.5' }],
        xl: ['clamp(1.1563rem, 0.6741rem + 0.1339cqw, 1.25rem)', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        '2xl': ['clamp(1.3438rem, 0.5402rem + 0.2232cqw, 1.5rem)', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        '3xl': ['clamp(1.625rem, 0.2107rem + 0.3929cqw, 1.9rem)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '4xl': ['clamp(2rem, -0.0571rem + 0.5714cqw, 2.4rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '5xl': ['clamp(2.5rem, -0.0714rem + 0.7143cqw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
      spacing: {
        // Named, single-sourced instead of the same magic number re-typed
        // as an arbitrary bracket value in every file that needed it
        // (found duplicated 3x for one, drifted-risk for the nav clearance).
        'safe-t-lg': 'max(16px, env(safe-area-inset-top))',
        'safe-t': 'max(14px, env(safe-area-inset-top))',
        'safe-t-sm': 'max(8px, env(safe-area-inset-top))',
        'safe-b': 'max(8px, env(safe-area-inset-bottom))',
        nav: '92px',
      },
      maxWidth: {
        shell: '430px',
      },
      height: {
        shell: '860px',
      },
      boxShadow: {
        card: '0 10px 28px -16px rgba(42, 24, 16, 0.22)',
        pop: '0 16px 32px -16px rgba(255, 122, 31, 0.32)',
        glow: '0 22px 44px -16px rgba(122, 53, 5, 0.45)',
        ring: '0 12px 26px -12px rgba(168, 74, 10, 0.35)',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        // xl/2xl/3xl used to all resolve to the same 20px — every single
        // card in the app was visually identical regardless of which class
        // was reached for. Gives each step real weight so surfaces can
        // actually be told apart instead of defaulting to rounded-3xl
        // everywhere out of habit.
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '28px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FFA05C 0%, #FF7A1F 55%, #7A3505 100%)',
        'gradient-primary-soft': 'linear-gradient(135deg, #FFA05C 0%, #A84A0A 100%)',
      },
    },
  },
  plugins: [],
}
