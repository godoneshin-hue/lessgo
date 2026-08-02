import { useStore } from '../state/store'

export default function ToastStack({ bottomOffset = 92 }: { bottomOffset?: number }) {
  const { toasts } = useStore()
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex flex-col items-center gap-2 px-5"
      style={{ bottom: bottomOffset }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white shadow-card"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
