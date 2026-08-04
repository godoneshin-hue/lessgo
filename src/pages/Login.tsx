import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useStore } from '../state/store'
import { ApiError } from '../lib/api'
import { formatPhone } from '../lib/phone'
import { kakaoLogin } from '../lib/kakao'
import { ChevronRightIcon, GoogleIcon, KakaoIcon } from '../components/icons'

export default function Login() {
  const navigate = useNavigate()
  const { login, socialAuth, pushToast } = useStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

  const canSubmit = phone.replace(/\D/g, '').length >= 10 && password.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setSubmitting(true)
    try {
      await login(phone, password)
      navigate('/home')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-primary px-6 pb-8 pt-[max(16px,env(safe-area-inset-top))] text-white">
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
          <p className="mt-1 text-sm text-white/80">전화번호로 로그인하고 이어서 진행해요.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-6 pb-8 pt-6">
        <label className="text-xs font-bold text-ink-soft">전화번호</label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-1234-5678"
          className="mt-2 rounded-xl border border-line bg-surface px-4 py-3 text-base tabular-nums text-ink outline-none focus:border-primary"
        />

        <label className="mt-4 text-xs font-bold text-ink-soft">비밀번호</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className="mt-2 rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
        />

        {error && <p className="mt-3 text-sm font-semibold text-warn-text">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-6 w-full rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
        >
          {submitting ? '로그인 중…' : '로그인'}
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs font-semibold text-ink-faint">또는</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={socialBusy}
            onClick={() => googleLogin()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3 text-sm font-bold text-ink disabled:opacity-60"
          >
            <GoogleIcon className="h-[18px] w-[18px]" />
            Google
          </button>
          <button
            type="button"
            disabled={socialBusy}
            onClick={handleKakaoLogin}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-3 text-sm font-bold text-[#3C1E1E] disabled:opacity-60"
          >
            <KakaoIcon className="h-[18px] w-[18px]" />
            카카오
          </button>
        </div>

        <p className="mt-auto pt-6 text-center text-sm text-ink-soft">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-bold text-primary-ink">
            회원가입하기
          </Link>
        </p>
      </form>
    </div>
  )
}
