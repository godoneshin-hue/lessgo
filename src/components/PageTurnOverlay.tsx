import { useEffect } from 'react'
import { useStore } from '../state/store'
import { usePrefersReducedMotion } from '../lib/useReducedMotion'

export default function PageTurnOverlay() {
  const { justAuthenticated, endAuthTransition } = useStore()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!justAuthenticated) return
    const duration = reduced ? 240 : 900
    const timer = window.setTimeout(endAuthTransition, duration)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justAuthenticated, reduced])

  if (!justAuthenticated) return null

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] overflow-hidden bg-bg"
      style={reduced ? undefined : { perspective: 1600 }}
    >
      <div
        className={reduced ? 'h-full w-full animate-page-fade bg-surface' : 'h-full w-full animate-page-turn bg-surface'}
        style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
      >
        <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-b from-primary to-primary-ink" />
        <div className="flex h-full flex-col items-center justify-center gap-4 px-10">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl font-black text-white shadow-pop">
            L
          </span>
          <p className="font-display text-2xl font-extrabold text-ink">LessGo</p>
        </div>
      </div>
    </div>
  )
}
