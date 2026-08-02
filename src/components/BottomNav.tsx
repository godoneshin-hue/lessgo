import { NavLink } from 'react-router-dom'
import { HomeIcon, FlagIcon, CameraIcon, ChartIcon, UserIcon } from './icons'

const TABS = [
  { to: '/home', label: '홈', Icon: HomeIcon },
  { to: '/challenges', label: '챌린지', Icon: FlagIcon },
  { to: '/verify', label: '인증', Icon: CameraIcon },
  { to: '/stats', label: '통계', Icon: ChartIcon },
  { to: '/me', label: '마이', Icon: UserIcon },
]

export default function BottomNav() {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
      <ul className="flex items-stretch justify-between px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-ink-faint hover:text-ink-soft'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-primary-tint' : ''
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-ink-faint'}`} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
