import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../state/store'
import * as api from '../lib/api'
import { ApiError } from '../lib/api'
import { APP_CATALOG } from '../state/seed'
import { ChevronRightIcon, XIcon } from '../components/icons'

const PERIOD_OPTIONS = [1, 3, 5, 7, 14, 30]
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1)

interface AppLimitRow {
  name: string
  icon: string
  hours: number
}

export default function ChallengeNew() {
  const navigate = useNavigate()
  const { profile, pushToast } = useStore()

  const [mode, setMode] = useState<'solo' | 'group' | null>(null)
  const [title, setTitle] = useState('')
  const [goalHours, setGoalHours] = useState(3)

  const [appLimits, setAppLimits] = useState<AppLimitRow[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [shakingApp, setShakingApp] = useState<string | null>(null)

  const [periodMode, setPeriodMode] = useState<'preset' | 'custom'>('preset')
  const [periodDays, setPeriodDays] = useState<number | null>(7)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [verifyHour12, setVerifyHour12] = useState(10)
  const [verifyMeridiem, setVerifyMeridiem] = useState<'AM' | 'PM'>('PM')

  const [unlimited, setUnlimited] = useState(true)
  const [maxParticipants, setMaxParticipants] = useState(6)
  const [openEnrollment, setOpenEnrollment] = useState(true)

  const [stakeEnabled, setStakeEnabled] = useState(false)
  const [stakeType, setStakeType] = useState<'donation' | 'bet'>('donation')
  const [donationAmount, setDonationAmount] = useState(1000)
  const [donationPeriod, setDonationPeriod] = useState<'day' | 'week'>('week')
  const [submitting, setSubmitting] = useState(false)

  const isGroup = mode === 'group'

  const customRangeValid = periodMode === 'custom' && startDate && endDate && endDate >= startDate
  const effectivePeriodDays =
    periodMode === 'custom'
      ? customRangeValid
        ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
        : null
      : periodDays

  const canSubmit = Boolean(mode) && title.trim().length > 0 && Boolean(effectivePeriodDays) && !submitting

  function addAppLimit(catalogItem: (typeof APP_CATALOG)[number]) {
    setAppLimits((prev) => {
      if (prev.some((a) => a.name === catalogItem.name)) return prev
      return [...prev, { ...catalogItem, hours: 1 }]
    })
    setPickerOpen(false)
  }

  function adjustAppLimit(name: string, delta: number) {
    setAppLimits((prev) =>
      prev.map((a) => {
        if (a.name !== name) return a
        const next = a.hours + delta
        if (next < 1) return a
        if (next > goalHours) {
          setShakingApp(name)
          window.setTimeout(() => setShakingApp((cur) => (cur === name ? null : cur)), 2000)
          return a
        }
        return { ...a, hours: next }
      }),
    )
  }

  function removeAppLimit(name: string) {
    setAppLimits((prev) => prev.filter((a) => a.name !== name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !effectivePeriodDays) return
    setSubmitting(true)
    try {
      const verifyByHour = verifyMeridiem === 'AM' ? verifyHour12 % 12 : (verifyHour12 % 12) + 12
      const { challenge } = await api.createChallenge(profile.id, {
        mode: mode!,
        title: title.trim(),
        goalMinutes: goalHours * 60,
        periodDays: effectivePeriodDays,
        startDate: periodMode === 'custom' ? startDate : null,
        endDate: periodMode === 'custom' ? endDate : null,
        maxParticipants: isGroup && !unlimited ? maxParticipants : null,
        openEnrollment: isGroup ? openEnrollment : false,
        stakeEnabled,
        stakeType: stakeEnabled ? stakeType : null,
        donationAmount: stakeEnabled ? donationAmount : 0,
        donationPeriod,
        verifyByHour,
        appLimits: appLimits.map((a) => ({ name: a.name, icon: a.icon, minutes: a.hours * 60 })),
      })
      pushToast('챌린지를 만들었어요')
      navigate(`/challenges/${challenge.id}`)
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '챌린지를 만들지 못했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col px-5 pb-6 pt-1">
      <div className="mb-3 flex items-center gap-2">
        <Link
          to="/challenges"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-ink"
          aria-label="뒤로 가기"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </Link>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">새 챌린지 만들기</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Section title="어떤 방식으로 할까요?">
          <div className="grid grid-cols-2 gap-2.5">
            <ModeCard active={mode === 'solo'} title="개인" desc="나 혼자만의 목표" onClick={() => setMode('solo')} />
            <ModeCard
              active={mode === 'group'}
              title="친구들과 함께"
              desc="같이 경쟁하고 응원해요"
              onClick={() => setMode('group')}
            />
          </div>
        </Section>

        {mode && (
          <>
            <Section title="챌린지 이름">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isGroup ? '예: 방학 스크린타임 줄이기' : '예: 시험기간 집중 챌린지'}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
              />
            </Section>

            <Section title="목표 시간" desc="하루 스마트폰 사용 시간 목표예요.">
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={goalHours}
                  onChange={(e) => setGoalHours(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
                  하루 {goalHours}시간
                </span>
              </div>
            </Section>

            <Section title="특정 앱 사용 시간" desc="앱별로 목표 시간을 나눠보세요 (선택).">
              {appLimits.length > 0 && (
                <ul className="mb-2.5 space-y-2">
                  {appLimits.map((a) => (
                    <li
                      key={a.name}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                        shakingApp === a.name
                          ? 'animate-shake-invalid border-red-400 bg-red-50'
                          : 'border-line bg-surface'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg text-base">
                        {a.icon}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-ink">{a.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustAppLimit(a.name, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-bg text-sm font-bold text-ink-soft active:scale-90"
                        >
                          −
                        </button>
                        <span className="w-14 text-center text-sm font-bold tabular-nums text-ink">
                          {a.hours}시간
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustAppLimit(a.name, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-bg text-sm font-bold text-ink-soft active:scale-90"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAppLimit(a.name)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-faint hover:text-warn-text"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="w-full rounded-xl border border-line py-2.5 text-sm font-bold text-ink-soft hover:border-primary hover:text-primary-ink"
                >
                  + 앱 추가하기
                </button>
                {pickerOpen && (
                  <div className="mt-2 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-bg p-3">
                    {APP_CATALOG.filter((c) => !appLimits.some((a) => a.name === c.name)).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => addAppLimit(c)}
                        className="flex flex-col items-center gap-1 rounded-xl bg-surface py-2.5 text-[11px] font-semibold text-ink-soft shadow-card active:scale-95"
                      >
                        <span className="text-lg">{c.icon}</span>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            <Section title="챌린지 기간">
              <div className="flex gap-2 rounded-full bg-bg p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPeriodMode('preset')}
                  className={`flex-1 rounded-full py-2 transition-colors ${
                    periodMode === 'preset' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
                  }`}
                >
                  기간 선택
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodMode('custom')}
                  className={`flex-1 rounded-full py-2 transition-colors ${
                    periodMode === 'custom' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
                  }`}
                >
                  직접 선택
                </button>
              </div>

              {periodMode === 'preset' ? (
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {PERIOD_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setPeriodDays(d)}
                      className={`rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                        periodDays === d ? 'border-primary bg-primary-tint text-primary-ink' : 'border-line text-ink-soft'
                      }`}
                    >
                      {d}일
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  />
                  <span className="text-sm text-ink-faint">~</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
              )}
            </Section>

            <Section title="인증 시간" desc="매일 이 시간까지 스크린타임을 인증해요.">
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3">
                <select
                  value={verifyHour12}
                  onChange={(e) => setVerifyHour12(Number(e.target.value))}
                  className="flex-1 bg-transparent text-sm font-bold text-ink outline-none"
                >
                  {HOURS_12.map((h) => (
                    <option key={h} value={h}>
                      {h}시
                    </option>
                  ))}
                </select>
                <div className="flex rounded-full bg-bg p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setVerifyMeridiem('AM')}
                    className={`rounded-full px-3 py-1.5 transition-colors ${
                      verifyMeridiem === 'AM' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
                    }`}
                  >
                    오전
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyMeridiem('PM')}
                    className={`rounded-full px-3 py-1.5 transition-colors ${
                      verifyMeridiem === 'PM' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
                    }`}
                  >
                    오후
                  </button>
                </div>
              </div>
            </Section>

            {isGroup && (
              <Section title="참여 인원">
                <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">최대 인원 수 설정</span>
                    <ToggleSwitch checked={!unlimited} onChange={(v) => setUnlimited(!v)} label="최대 인원 수 설정" />
                  </div>
                  {!unlimited && (
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={2}
                        max={40}
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-ink">
                        {maxParticipants}명
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-line pt-2.5">
                    <span>
                      <span className="block text-sm font-semibold text-ink">계속 참여 가능</span>
                      <span className="block text-xs text-ink-soft">시작 후에도 새로운 친구가 들어올 수 있어요</span>
                    </span>
                    <ToggleSwitch checked={openEnrollment} onChange={setOpenEnrollment} label="계속 참여 가능" />
                  </div>
                </div>
              </Section>
            )}

            <Section title="기부 · 내기" desc="목표를 못 지키면 정해둔 금액이 쌓여요. 안 걸어도 괜찮아요.">
              <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">기부/내기 설정</span>
                  <ToggleSwitch checked={stakeEnabled} onChange={setStakeEnabled} label="기부/내기 설정" />
                </div>

                {stakeEnabled && (
                  <>
                    <div className="flex gap-2 rounded-full bg-bg p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setStakeType('donation')}
                        className={`flex-1 rounded-full py-2 transition-colors ${
                          stakeType === 'donation' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
                        }`}
                      >
                        기부
                      </button>
                      <button
                        type="button"
                        onClick={() => setStakeType('bet')}
                        className={`flex-1 rounded-full py-2 transition-colors ${
                          stakeType === 'bet' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
                        }`}
                      >
                        내기
                      </button>
                    </div>

                    <div className="flex items-center gap-2 border-t border-line pt-3">
                      <span className="text-sm font-semibold text-ink-soft">금액</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(Math.max(0, Number(e.target.value)))}
                        className="w-24 rounded-lg bg-bg px-2 py-1.5 text-right text-base font-bold tabular-nums text-ink outline-none"
                      />
                      <span className="text-sm font-semibold text-ink-soft">원 /</span>
                      <div className="ml-auto flex rounded-full bg-bg p-0.5 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setDonationPeriod('day')}
                          className={`rounded-full px-3 py-1.5 transition-colors ${
                            donationPeriod === 'day' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
                          }`}
                        >
                          일
                        </button>
                        <button
                          type="button"
                          onClick={() => setDonationPeriod('week')}
                          className={`rounded-full px-3 py-1.5 transition-colors ${
                            donationPeriod === 'week' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
                          }`}
                        >
                          주
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Section>
          </>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 w-full rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
        >
          {submitting ? '만드는 중…' : '챌린지 만들기'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-ink">{title}</p>
      {desc && <p className="mt-0.5 text-xs text-ink-soft">{desc}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

function ModeCard({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
        active ? 'border-primary bg-primary-tint' : 'border-line bg-surface'
      }`}
    >
      <span className={`block text-sm font-bold ${active ? 'text-primary-ink' : 'text-ink'}`}>{title}</span>
      <span className="mt-0.5 block text-xs text-ink-soft">{desc}</span>
    </button>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
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
  )
}
