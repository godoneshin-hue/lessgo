import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useStore } from '../state/store'
import { ApiError } from '../lib/api'
import { formatPhone } from '../lib/phone'
import { fileToAvatarDataUrl } from '../lib/image'
import { kakaoLogin } from '../lib/kakao'
import { pickAvatarEmoji } from '../state/seed'
import Avatar from '../components/Avatar'
import { CameraIcon, ChevronRightIcon, GoogleIcon, KakaoIcon } from '../components/icons'

const SCHOOL_LEVELS = [
  { label: '중학생', full: '중학교' },
  { label: '고등학생', full: '고등학교' },
]
const GRADE_NUMS = [1, 2, 3]

type Step = 'method' | 'credentials' | 'profile'
type SocialProvider = 'google' | 'kakao'

export default function Signup() {
  const navigate = useNavigate()
  const { signup, socialAuth, pushToast } = useStore()

  const [step, setStep] = useState<Step>('method')
  const [authProvider, setAuthProvider] = useState<'phone' | SocialProvider | null>(null)
  const [socialToken, setSocialToken] = useState('')
  const [socialBusy, setSocialBusy] = useState(false)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [schoolLevel, setSchoolLevel] = useState<(typeof SCHOOL_LEVELS)[number] | null>(null)
  const [gradeNum, setGradeNum] = useState<number | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [avatar, setAvatar] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const grade = schoolLevel && gradeNum ? `${schoolLevel.full} ${gradeNum}학년` : ''

  const canSubmitCredentials = phone.replace(/\D/g, '').length >= 10 && password.trim().length > 0
  const canSubmitProfile = name.trim().length > 0 && school.trim().length > 0 && grade.length > 0 && !submitting

  async function chooseSocial(provider: SocialProvider, token: string) {
    setAuthProvider(provider)
    setSocialToken(token)
    setSocialBusy(true)
    try {
      const result = await socialAuth(provider, token)
      if (result.needsProfile) {
        setStep('profile')
        pushToast(`${provider === 'google' ? 'Google' : '카카오'} 인증이 완료됐어요`)
      } else {
        // Token already belongs to an existing account — this is really a
        // login, not a signup, so just take them straight in.
        navigate('/home')
      }
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '인증에 실패했어요.')
    } finally {
      setSocialBusy(false)
    }
  }

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: (res) => chooseSocial('google', res.access_token),
    onError: () => pushToast('구글 인증에 실패했어요.'),
  })

  async function chooseKakao() {
    try {
      const token = await kakaoLogin()
      await chooseSocial('kakao', token)
    } catch {
      pushToast('카카오 인증에 실패했어요.')
    }
  }

  function choosePhone() {
    setAuthProvider('phone')
    setStep('credentials')
  }

  function handleCredentialsNext(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmitCredentials) return
    setStep('profile')
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setAvatar(await fileToAvatarDataUrl(file))
    } catch {
      setError('사진을 처리하지 못했어요. 다른 사진으로 시도해주세요.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmitProfile) return
    setError('')
    setSubmitting(true)
    try {
      if (authProvider === 'google' || authProvider === 'kakao') {
        const result = await socialAuth(authProvider, socialToken, {
          name: name.trim(),
          school: school.trim(),
          grade,
          inviteCode: inviteCode.trim(),
          avatar,
        })
        if (result.needsProfile) throw new ApiError('인증이 만료됐어요. 다시 시도해주세요.')
      } else {
        await signup({ authProvider: 'phone', name: name.trim(), school: school.trim(), grade, phone, password, inviteCode: inviteCode.trim(), avatar })
      }
      navigate('/home')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '가입에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  function goBack() {
    if (step === 'profile') {
      setStep(authProvider === 'phone' ? 'credentials' : 'method')
    } else if (step === 'credentials') {
      setStep('method')
    } else {
      navigate('/welcome')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-primary px-6 pb-6 pt-[max(16px,env(safe-area-inset-top))] text-white">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/10" />
        <button
          type="button"
          onClick={goBack}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:text-white"
          aria-label="뒤로 가기"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>
        <h1 className="relative mt-3 text-xl font-black tracking-tight">회원가입</h1>
        <p className="relative mt-1 text-sm text-white/80">
          {step === 'method' && '어떤 방법으로 시작할까요?'}
          {step === 'credentials' && '로그인에 사용할 정보를 입력해주세요.'}
          {step === 'profile' && '친구들과 같은 학교인지 확인하는 데 쓰여요.'}
        </p>
      </div>

      {step === 'method' && (
        <div className="flex flex-1 flex-col gap-3 px-6 pb-8 pt-6">
          <button
            type="button"
            disabled={socialBusy}
            onClick={() => googleLogin()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3.5 text-sm font-bold text-ink disabled:opacity-60"
          >
            <GoogleIcon className="h-[18px] w-[18px]" />
            Google로 계속하기
          </button>
          <button
            type="button"
            disabled={socialBusy}
            onClick={chooseKakao}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-3.5 text-sm font-bold text-[#3C1E1E] disabled:opacity-60"
          >
            <KakaoIcon className="h-[18px] w-[18px]" />
            카카오로 계속하기
          </button>
          <button
            type="button"
            onClick={choosePhone}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow"
          >
            📱 전화번호로 계속하기
          </button>
          <p className="mt-auto pt-6 text-center text-sm text-ink-soft">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-bold text-primary-ink">
              로그인하기
            </Link>
          </p>
        </div>
      )}

      {step === 'credentials' && (
        <form onSubmit={handleCredentialsNext} className="flex flex-1 flex-col px-6 pb-8 pt-6">
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="mt-2 rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!canSubmitCredentials}
            className="mt-6 w-full rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
          >
            다음
          </button>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 pb-8 pt-6">
          <div className="flex justify-center">
            <label className="group relative cursor-pointer">
              <Avatar src={avatar} emoji={pickAvatarEmoji(name || '?')} size={84} />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg bg-primary text-white shadow-pop transition-transform group-active:scale-90">
                <CameraIcon className="h-3.5 w-3.5" />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            </label>
          </div>
          <p className="-mt-2 text-center text-xs text-ink-faint">프로필 사진 (선택)</p>

          {(authProvider === 'google' || authProvider === 'kakao') && (
            <p className="-mt-1 rounded-xl bg-primary-tint px-3 py-2 text-center text-xs font-semibold text-primary-ink">
              {authProvider === 'google' ? 'Google' : '카카오'} 계정으로 가입해요
            </p>
          )}

          <Field label="이름 (본명)">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </Field>

          <Field label="학교">
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="OO중학교"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </Field>

          <Field label="학년">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {SCHOOL_LEVELS.map((level) => (
                  <button
                    key={level.label}
                    type="button"
                    onClick={() => setSchoolLevel(level)}
                    className={`rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${
                      schoolLevel?.label === level.label
                        ? 'border-primary bg-primary-tint text-primary-ink'
                        : 'border-line text-ink-soft'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 gap-1.5">
                {GRADE_NUMS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGradeNum(n)}
                    className={`flex-1 rounded-xl border py-3 text-sm font-bold transition-colors ${
                      gradeNum === n ? 'border-primary bg-primary-tint text-primary-ink' : 'border-line text-ink-soft'
                    }`}
                  >
                    {n}학년
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <Field label="초대코드 (선택)">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="예: LESSGO2026"
              className="w-full rounded-xl border border-dashed border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </Field>

          {error && <p className="text-sm font-semibold text-warn-text">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmitProfile}
            className="mt-2 w-full rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
          >
            {submitting ? '가입 처리 중…' : '가입 완료'}
          </button>
        </form>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-bold text-ink-soft">{label}</span>
      <div className="mt-2">{children}</div>
    </div>
  )
}
