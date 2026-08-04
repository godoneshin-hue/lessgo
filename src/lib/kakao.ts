declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void
      isInitialized: () => boolean
      Auth: {
        login: (options: { success: (auth: { access_token: string }) => void; fail: (err: unknown) => void }) => void
      }
    }
  }
}

let initialized = false

function ensureInit() {
  const key = import.meta.env.VITE_KAKAO_JS_KEY
  if (!key || !window.Kakao) return false
  if (!initialized) {
    window.Kakao.init(key)
    initialized = true
  }
  return true
}

export function kakaoLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ensureInit() || !window.Kakao) {
      reject(new Error('카카오 SDK를 불러오지 못했어요.'))
      return
    }
    window.Kakao.Auth.login({
      success: (auth) => resolve(auth.access_token),
      fail: (err) => reject(err),
    })
  })
}
