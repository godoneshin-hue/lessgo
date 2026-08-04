import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../state/store'
import { isSuccess } from '../lib/stats'
import { usePersonalChallenge } from '../lib/usePersonalChallenge'
import { addDays, minutesToLabel, todayISO, weekdayKr } from '../lib/date'
import { APP_CATALOG, simulateAppBreakdown } from '../state/seed'
import type { AppUsage } from '../state/types'
import { CameraIcon, ChevronRightIcon, XIcon } from '../components/icons'
import AppIcon from '../components/AppIcon'

export default function Verify() {
  const { records, todayRecord, verifyToday, pushToast } = useStore()
  const { personalChallenge, loading } = usePersonalChallenge()
  const [apps, setApps] = useState<AppUsage[]>([])
  const [seeded, setSeeded] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const today = todayISO()

  // Pre-fill the app list from the challenge's own per-app limits so the
  // user just fills in numbers instead of re-adding each app.
  useEffect(() => {
    if (seeded || !personalChallenge || personalChallenge.appLimits.length === 0) return
    setApps(personalChallenge.appLimits.map((a) => ({ name: a.name, icon: a.icon, minutes: 0 })))
    setSeeded(true)
  }, [personalChallenge, seeded])

  if (loading) {
    return <p className="px-5 py-10 text-center text-sm text-ink-faint">불러오는 중…</p>
  }

  if (!personalChallenge) {
    return (
      <div className="flex flex-col items-center px-5 pb-6 pt-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint text-3xl">🎯</span>
        <h1 className="mt-4 text-lg font-extrabold tracking-tight text-ink">먼저 개인 챌린지를 만들어주세요</h1>
        <p className="mt-1 text-sm text-ink-soft">목표가 있어야 오늘 사용 시간을 인증할 수 있어요.</p>
        <Link
          to="/challenges/new"
          className="mt-5 rounded-full bg-gradient-primary-soft px-6 py-2.5 text-sm font-extrabold text-white shadow-glow active:scale-95"
        >
          챌린지 만들러 가기
        </Link>
      </div>
    )
  }

  const threshold = { dailyLimitMinutes: personalChallenge.goalMinutes }
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)))
  const total = apps.reduce((sum, a) => sum + a.minutes, 0)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const goalMinutes = personalChallenge!.goalMinutes
    const simulatedTotal = Math.round((goalMinutes - 60 + Math.random() * 120) / 60) * 60
    const breakdown = simulateAppBreakdown(Math.max(60, simulatedTotal))
    setApps(breakdown)
    setFileName(file.name)
    pushToast(`캡처에서 앱 ${breakdown.length}개 사용 내역을 찾았어요`)
  }

  function addApp(catalogItem: (typeof APP_CATALOG)[number]) {
    setApps((prev) => {
      if (prev.some((a) => a.name === catalogItem.name)) return prev
      return [...prev, { ...catalogItem, minutes: 60 }]
    })
    setPickerOpen(false)
  }

  function updateHours(index: number, minutes: number) {
    setApps((prev) => prev.map((a, i) => (i === index ? { ...a, minutes: Math.max(0, minutes) } : a)))
  }

  function removeApp(index: number) {
    setApps((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    verifyToday(total, apps)
    const success = total <= threshold.dailyLimitMinutes
    pushToast(success ? '인증 완료! 오늘 목표를 달성했어요 🎉' : '인증 완료! 오늘은 목표를 조금 넘었어요')
  }

  if (todayRecord.verified) {
    const success = isSuccess(todayRecord, threshold)
    return (
      <div className="flex flex-col items-center px-5 pb-6 pt-10 text-center">
        {success ? (
          <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-primary p-7 text-white shadow-glow">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/10" />
            <span className="relative block text-5xl">🏆</span>
            <h1 className="relative mt-3 text-xl font-black tracking-tight">오늘 목표 달성!</h1>
            <p className="relative mt-1 text-sm text-white/85">
              오늘 사용 시간{' '}
              <span className="font-bold text-white">{minutesToLabel(todayRecord.usedMinutes ?? 0)}</span>
            </p>
          </div>
        ) : (
          <>
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-warn-tint text-4xl">⚠️</span>
            <h1 className="mt-4 text-xl font-extrabold text-ink">오늘은 목표를 넘었어요</h1>
            <p className="mt-1 text-sm text-ink-soft">
              오늘 사용 시간 <span className="font-bold text-ink">{minutesToLabel(todayRecord.usedMinutes ?? 0)}</span>
            </p>
          </>
        )}

        {todayRecord.apps && todayRecord.apps.length > 0 && (
          <div className="mt-5 w-full rounded-3xl bg-surface p-4 text-left shadow-card">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">앱별 사용 내역</p>
            <ul className="divide-y divide-line">
              {todayRecord.apps.map((a) => (
                <AppRow key={a.name} app={a} />
              ))}
            </ul>
          </div>
        )}

        <WeekStrip days={last7} records={records} threshold={threshold} />

        <Link to="/stats" className="mt-6 flex items-center gap-1 text-sm font-bold text-primary-ink">
          전체 기록 보기 <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="px-5 pb-6 pt-1">
      <h1 className="text-lg font-extrabold tracking-tight text-ink">오늘의 스크린타임 인증</h1>
      <p className="mt-1 text-sm text-ink-soft">
        목표는 <span className="font-bold text-ink">{minutesToLabel(personalChallenge.goalMinutes)}</span> 이내예요.
      </p>

      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface px-4 py-4 text-sm font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary-ink">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary-ink">
          <CameraIcon className="h-5 w-5" />
        </span>
        <span>{fileName ? `첨부됨 · ${fileName}` : '스크린타임 캡처 업로드하고 자동으로 채우기'}</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>

      <section className="mt-4 rounded-3xl bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">앱별 사용 내역</p>
          <span className="font-display text-sm font-black tabular-nums text-ink">{minutesToLabel(total)}</span>
        </div>

        {apps.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">아직 추가된 앱이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {apps.map((app, idx) => (
              <li key={app.name} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-lg">
                  <AppIcon icon={app.icon} className="h-6 w-6" />
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">{app.name}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateHours(idx, app.minutes - 60)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-bg text-sm font-bold text-ink-soft active:scale-90"
                    aria-label={`${app.name} 1시간 줄이기`}
                  >
                    −
                  </button>
                  <span className="w-14 text-center text-sm font-bold tabular-nums text-ink">
                    {minutesToLabel(app.minutes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateHours(idx, app.minutes + 60)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-bg text-sm font-bold text-ink-soft active:scale-90"
                    aria-label={`${app.name} 1시간 늘리기`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeApp(idx)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-faint hover:text-warn-text"
                  aria-label={`${app.name} 삭제`}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative mt-3">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full rounded-xl border border-line py-2.5 text-sm font-bold text-ink-soft hover:border-primary hover:text-primary-ink"
          >
            + 앱 추가하기
          </button>
          {pickerOpen && (
            <div className="mt-2 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-bg p-3">
              {APP_CATALOG.filter((c) => !apps.some((a) => a.name === c.name)).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => addApp(c)}
                  className="flex flex-col items-center gap-1 rounded-xl bg-surface py-2.5 text-[11px] font-semibold text-ink-soft shadow-card active:scale-95"
                >
                  <AppIcon icon={c.icon} className="h-7 w-7 rounded-lg" />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={apps.length === 0}
          className="mt-5 w-full rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
        >
          인증 완료하기
        </button>
      </section>

      <WeekStrip days={last7} records={records} threshold={threshold} />
    </div>
  )
}

function AppRow({ app }: { app: AppUsage }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-base">
        <AppIcon icon={app.icon} className="h-5 w-5" />
      </span>
      <span className="flex-1 text-sm font-semibold text-ink">{app.name}</span>
      <span className="text-sm font-bold tabular-nums text-ink-soft">{minutesToLabel(app.minutes)}</span>
    </li>
  )
}

function WeekStrip({
  days,
  records,
  threshold,
}: {
  days: string[]
  records: ReturnType<typeof useStore>['records']
  threshold: { dailyLimitMinutes: number }
}) {
  return (
    <div className="mt-6 flex justify-between gap-1.5">
      {days.map((date) => {
        const record = records.find((r) => r.date === date)
        const success = record && isSuccess(record, threshold)
        const fail = record?.verified && !success
        return (
          <div key={date} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                success
                  ? 'bg-success-tint text-success-text'
                  : fail
                    ? 'bg-warn-tint text-warn-text'
                    : 'bg-line text-ink-faint'
              }`}
            >
              {success ? '✓' : fail ? '!' : '·'}
            </span>
            <span className="text-[10px] font-semibold text-ink-faint">{weekdayKr(date)}</span>
          </div>
        )
      })}
    </div>
  )
}
