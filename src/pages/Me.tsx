import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../state/store'
import { currentStreak } from '../lib/stats'
import { usePersonalChallenge } from '../lib/usePersonalChallenge'
import { fileToAvatarDataUrl } from '../lib/image'
import Avatar from '../components/Avatar'
import { CameraIcon, ChevronRightIcon, FlagIcon } from '../components/icons'

const PREMIUM_FEATURES = [
  { free: '기본 목표 설정', premium: '기본 목표 설정' },
  { free: '친구 챌린지 월 3회', premium: '친구 챌린지 무제한' },
  { free: '-', premium: '기부 챌린지 무제한' },
  { free: '최근 7일 통계', premium: '전체 기간 통계' },
]

export default function Me() {
  const { profile, records, pushToast, logout, updateAvatar } = useStore()
  const { personalChallenge } = usePersonalChallenge()
  const navigate = useNavigate()
  const [reminderOn, setReminderOn] = useState(true)
  const [challengeAlertOn, setChallengeAlertOn] = useState(true)
  const [uploading, setUploading] = useState(false)
  const streak = personalChallenge ? currentStreak(records, { dailyLimitMinutes: personalChallenge.goalMinutes }) : 0

  function handleLogout() {
    logout()
    navigate('/login')
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      await updateAvatar(dataUrl)
      pushToast('프로필 사진이 바뀌었어요')
    } catch {
      pushToast('사진을 바꾸지 못했어요. 다시 시도해주세요.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4 px-5 pb-6 pt-1">
      <h1 className="text-lg font-extrabold tracking-tight text-ink">마이페이지</h1>

      <section className="flex items-center gap-4 rounded-3xl bg-surface p-5 shadow-card">
        <label className="group relative shrink-0 cursor-pointer">
          <Avatar src={profile.avatar} emoji={profile.emoji} size={56} />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-primary text-white transition-transform group-active:scale-90">
            <CameraIcon className="h-3 w-3" />
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} disabled={uploading} />
        </label>
        <div className="flex-1">
          <p className="text-base font-extrabold text-ink">{profile.name}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {profile.school && profile.grade ? `${profile.school} · ${profile.grade}` : '학교 정보를 등록해 보세요'}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {personalChallenge ? `🔥 연속 ${streak}일 · ${personalChallenge.periodDays}일 챌린지` : '아직 개인 챌린지가 없어요'}
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-surface p-2 shadow-card">
        <MenuRow label="내 챌린지 보기" to="/challenges" icon={<FlagIcon className="h-4 w-4" />} />
        <ToggleRow label="인증 리마인더 알림" checked={reminderOn} onChange={setReminderOn} />
        <ToggleRow label="챌린지 알림" checked={challengeAlertOn} onChange={setChallengeAlertOn} />
      </section>

      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-ink p-5 text-white shadow-pop">
        <p className="text-xs font-bold uppercase tracking-wide text-white/80">프리미엄</p>
        <p className="mt-1 text-lg font-extrabold">더 많은 챌린지, 더 큰 동기부여</p>
        <div className="mt-3 space-y-1.5 text-sm">
          {PREMIUM_FEATURES.map((f) => (
            <div key={f.premium} className="flex items-center gap-2 text-white/90">
              <span className="text-white">✓</span> {f.premium}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => pushToast('프로토타입에서는 결제가 지원되지 않아요')}
          className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-extrabold text-primary-ink active:scale-[0.99]"
        >
          월 3,900원으로 시작하기
        </button>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full rounded-3xl bg-surface py-3.5 text-sm font-bold text-ink-soft shadow-card"
      >
        로그아웃
      </button>
    </div>
  )
}

function MenuRow({ label, to, icon }: { label: string; to: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl px-3.5 py-3.5 hover:bg-bg">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg text-ink-soft">
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold text-ink">{label}</span>
      <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
    </Link>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-line'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
