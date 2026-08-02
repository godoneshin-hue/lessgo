interface IconProps {
  className?: string
}

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 4 0v5h3a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M6 3v18" />
      <path d="M6 4.5c2-1.2 3.8-1.2 5.5 0s3.5 1.2 5.5 0v8c-2 1.2-3.8 1.2-5.5 0s-3.5-1.2-5.5 0Z" />
    </svg>
  )
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3 11 14.8l4.5-5.6" />
    </svg>
  )
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
      <path d="M3 20h18" />
    </svg>
  )
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <circle cx="12" cy="8.3" r="3.3" />
      <path d="M5 20c1.3-3.6 4-5.4 7-5.4S18.7 16.4 20 20" />
    </svg>
  )
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M12 3c1 2.2-.3 3.4-1.2 4.6-1.1 1.4-1.8 2.7-1.8 4.3a4.9 4.9 0 0 0 9.8.3c.2-2-.5-3.4-1.5-4.5.1 1.4-.5 2.1-1.2 2.2-.6-2.7-2-3.9-4.1-6.9Z" />
    </svg>
  )
}

export function GiftIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <rect x="4" y="9.5" width="16" height="4" rx="1" />
      <rect x="5.5" y="13.5" width="13" height="7" rx="1" />
      <path d="M12 9.5v11" />
      <path d="M12 9.5C10.5 6 7 6.3 7 8.2 7 9.5 8.5 9.5 12 9.5Z" />
      <path d="M12 9.5c1.5-3.5 5-3.2 5-1.3 0 1.3-1.5 1.3-5 1.3Z" />
    </svg>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.6 6.4l-1.5 1.5M7.9 16.1l-1.5 1.5M17.6 17.6l-1.5-1.5M7.9 7.9 6.4 6.4" />
    </svg>
  )
}

export function CameraIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.8l1-1.5h7.4l1 1.5h1.8A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function SchoolIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
      <path d="M7 11.5V16c0 1.1 2.2 2 5 2s5-.9 5-2v-4.5" />
      <path d="M20 9.5v6" />
    </svg>
  )
}

export function GoogleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z" />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  )
}

export function KakaoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#3C1E1E"
        d="M12 3.5c-5.25 0-9.5 3.36-9.5 7.5 0 2.64 1.73 4.96 4.34 6.3-.19.7-.7 2.56-.8 2.96-.12.5.18.49.38.36.16-.1 2.5-1.7 3.52-2.4.66.1 1.35.15 2.06.15 5.25 0 9.5-3.36 9.5-7.37S17.25 3.5 12 3.5Z"
      />
    </svg>
  )
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg className={className} {...common}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 7.5 12.6 5.9a3.2 3.2 0 0 1 4.5 4.5L15.5 12" />
      <path d="M13 16.5 11.4 18.1a3.2 3.2 0 0 1-4.5-4.5L8.5 12" />
    </svg>
  )
}
