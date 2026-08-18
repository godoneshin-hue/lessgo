import { useStore } from '../state/store'

// Unlike ToastStack, this doesn't auto-dismiss — it stays until the user
// actually updates, since the whole point is that they can't tell anything's
// stale on their own (see lib/pwaUpdate.ts).
export default function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useStore()
  if (!updateAvailable) return null

  return (
    <div className="absolute inset-x-0 top-0 z-40 flex justify-center px-3 pt-[max(8px,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={applyUpdate}
        className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-bold text-white shadow-card active:scale-95"
      >
        새 버전이 있어요 · 새로고침
      </button>
    </div>
  )
}
