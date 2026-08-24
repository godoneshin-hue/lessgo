import { useStore } from '../state/store'
import { currentStreak } from '../lib/stats'
import { usePersonalChallenge } from '../lib/usePersonalChallenge'
import { FlameIcon } from './icons'

export default function TopBar() {
  const { records } = useStore()
  const { personalChallenge } = usePersonalChallenge()
  const streak = personalChallenge ? currentStreak(records, { dailyLimitMinutes: personalChallenge.goalMinutes }) : 0

  return (
    <header className="flex items-center justify-between px-5 pb-2 pt-safe-t">
      <div className="flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-gradient-primary-soft text-[13px] font-black text-white">
          L
        </span>
        <span className="font-display text-[15px] font-extrabold tracking-tight text-ink">LessGo</span>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-gold-tint px-2.5 py-1 text-xs font-bold text-gold-ink">
        <FlameIcon className="h-3.5 w-3.5" />
        {streak}일 연속
      </div>
    </header>
  )
}
