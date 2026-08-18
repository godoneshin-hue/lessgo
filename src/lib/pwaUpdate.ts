import { registerSW } from 'virtual:pwa-register'

// registerType: 'autoUpdate' downloads a new build in the background but
// never applies it to the already-open tab — the user just keeps seeing the
// old screen with no sign anything changed. This wraps the registration so
// the app can show a banner and let the user trigger the reload themselves,
// instead of "close and reopen the app" being the only fix anyone can give.
let applyUpdateFn: (() => void) | null = null

export function initPwaUpdate(onUpdateAvailable: () => void) {
  const updateSW = registerSW({
    onNeedRefresh() {
      applyUpdateFn = () => updateSW(true)
      onUpdateAvailable()
    },
  })
}

export function applyPwaUpdate() {
  applyUpdateFn?.()
}
