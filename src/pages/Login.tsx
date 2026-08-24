import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useStore } from '../state/store'
import { ApiError } from '../lib/api'
import { kakaoLogin } from '../lib/kakao'
import { ChevronRightIcon, GoogleIcon, KakaoIcon } from '../components/icons'

export default function Login() {
  const navigate = useNavigate()
  const { socialAuth, pushToast } = useStore()
  const [socialBusy, setSocialBusy] = useState(false)

  async function handleSocial(provider: 'google' | 'kakao', token: string) {
    setSocialBusy(true)
    try {
      const result = await socialAuth(provider, token)
      if (result.needsProfile) {
        pushToast('가입된 계정이 없어요, 회원가입으로 진행해주세요')
        navigate('/signup')
        return
      }
      navigate('/home')
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '로그인에 실패했어요.')
    } finally {
      setSocialBusy(false)
    }
  }

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: (res) => handleSocial('google', res.access_token),
    onError: () => pushToast('구글 로그인에 실패했어요.'),
  })

  async function handleKakaoLogin() {
    try {
      const token = await kakaoLogin()
      await handleSocial('kakao', token)
    } catch {
      pushToast('카카오 로그인에 실패했어요.')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-primary px-6 pb-8 pt-safe-t-lg text-white">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
        <Link
          to="/welcome"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:text-white"
          aria-label="뒤로 가기"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </Link>
        <div className="relative mt-2 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-black backdrop-blur">
            L
          </span>
          <p className="mt-2 font-display text-base font-extrabold">LessGo</p>
          <h1 className="mt-5 text-xl font-black tracking-tight">다시 만나서 반가워요</h1>
          <p className="mt-1 text-sm text-white/80">Google 또는 카카오로 로그인해요.</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-8 pt-8">
        <button
          type="button"
          disabled={socialBusy}
          onClick={() => googleLogin()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3.5 text-sm font-bold text-ink disabled:opacity-60"
        >
          <GoogleIcon className="h-[18px] w-[18px]" />
          Google로 로그인
        </button>
        <button
          type="button"
          disabled={socialBusy}
          onClick={handleKakaoLogin}
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-3.5 text-sm font-bold text-[#3C1E1E] disabled:opacity-60"
        >
          <KakaoIcon className="h-[18px] w-[18px]" />
          카카오로 로그인
        </button>

        <p className="mt-auto pt-6 text-center text-sm text-ink-soft">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-bold text-primary-ink">
            회원가입하기
          </Link>
        </p>
      </div>
    </div>
  )
}
