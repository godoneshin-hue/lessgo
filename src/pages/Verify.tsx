import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../state/store'
import { bestStreak, isSuccess } from '../lib/stats'
import { usePersonalChallenge } from '../lib/usePersonalChallenge'
import { addDays, minutesToLabel, todayISO, weekdayKr } from '../lib/date'
import { fileToScreenshotDataUrl } from '../lib/image'
import * as api from '../lib/api'
import { ApiError } from '../lib/api'
import type { AppUsage, DayRecord } from '../state/types'
import { STREAK_BADGES } from '../state/badges'
import { ChevronRightIcon, XIcon } from '../components/icons'
import AppIcon from '../components/AppIcon'

const MAX_IMAGES = 10

export default function Verify() {
  const { profile, records, todayRecord, verifyToday, unverifyToday, pushToast } = useStore()
  const { personalChallenge, loading } = usePersonalChallenge()
  const [apps, setApps] = useState<AppUsage[]>([])
  const [seeded, setSeeded] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [totalFromAnalysis, setTotalFromAnalysis] = useState<number | null>(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [missingApps, setMissingApps] = useState<string[]>([])

  const today = todayISO()

  // Pre-fill the app list from the challenge's own per-app limits so the
  // user just fills in numbers instead of re-adding each app.
  useEffect(() => {
    if (seeded || !personalChallenge || personalChallenge.appLimits.length === 0) return
    setApps(personalChallenge.appLimits.map((a) => ({ name: a.name, icon: a.icon, minutes: 0 })))
    setSeeded(true)
  }, [personalChallenge, seeded])

  // The server is the source of truth for "is today verified" — cancelling
  // is admin-only (no user-facing route for it), so if an admin deleted
  // today's record, this brings the local copy back in sync instead of the
  // device going on showing a stale "verified" state forever.
  useEffect(() => {
    if (!profile.id || !todayRecord.verified) return
    api
      .getVerification(profile.id, today)
      .then(({ verification }) => {
        if (!verification) unverifyToday()
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, today])

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
  const total = totalFromAnalysis ?? apps.reduce((sum, a) => sum + a.minutes, 0)

  async function handleFilesAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    if (images.length + files.length > MAX_IMAGES) {
      pushToast(`사진은 최대 ${MAX_IMAGES}장까지 업로드할 수 있어요.`)
      return
    }
    try {
      const next = await Promise.all(files.map((f) => fileToScreenshotDataUrl(f)))
      setImages((prev) => [...prev, ...next])
    } catch {
      pushToast('사진을 처리하지 못했어요. 다른 사진으로 시도해주세요.')
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function runAnalysis() {
    if (images.length === 0 || !profile.id) return
    setAnalyzing(true)
    try {
      const trackedAppNames = apps.map((a) => a.name)
      const result = await api.analyzeScreenTime(profile.id, images, trackedAppNames)
      setApps((prev) => prev.map((a) => {
        const match = result.apps.find((r) => r.name === a.name)
        return match ? { ...a, minutes: match.minutes } : a
      }))
      setTotalFromAnalysis(result.totalMinutes)

      const missingNames = trackedAppNames.filter((name) => !result.apps.some((r) => r.name === name))
      setMissingApps(missingNames)

      if (result.dateMatches === false) {
        pushToast('오늘 날짜 스크린샷이 아닌 것 같아요. 오늘 사용 시간이 맞는지 확인해주세요.')
      }
      if (missingNames.length > 0) {
        // Some tracked apps never showed up in any uploaded screenshot — block
        // submission rather than letting a partial (silently-zeroed) result
        // through, since the persistent banner below is the real signal here.
        setHasAnalyzed(false)
        pushToast(`${missingNames.join(', ')} 사용 시간이 없어요. 스크린샷을 추가로 올려주세요.`)
      } else {
        setHasAnalyzed(true)
        if (result.dateMatches !== false) pushToast('사진 분석이 끝났어요.')
      }
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '사진을 분석하지 못했어요.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSubmit() {
    // Compare best-streak-so-far against what it'll become after today's
    // record lands, so a freshly-crossed badge tier gets its own toast
    // instead of silently unlocking in the background.
    const projected: DayRecord[] = [...records.filter((r) => r.date !== today), { date: today, usedMinutes: total, verified: true, apps }]
    const prevBest = bestStreak(records, threshold)
    const newBest = bestStreak(projected, threshold)
    const newlyUnlocked = [...STREAK_BADGES].reverse().find((b) => b.days !== undefined && prevBest < b.days && b.days <= newBest)

    verifyToday(total, apps)
    const success = total <= threshold.dailyLimitMinutes
    pushToast(success ? '인증 완료! 오늘 목표를 달성했어요 🎉' : '인증 완료! 오늘은 목표를 조금 넘었어요')
    if (newlyUnlocked) {
      pushToast(`${newlyUnlocked.icon} ${newlyUnlocked.label} 뱃지를 획득했어요!`)
    }
    if (profile.id) {
      try {
        const { cashEarned } = await api.submitVerification(profile.id, today, total, apps)
        if (cashEarned > 0) pushToast(`오늘 인증하고 캐시 ${cashEarned}개 받았어요 🪙`)
      } catch {
        // The local record already drives the UI — a failed server sync just
        // means admin can't audit/delete this one and cash wasn't credited.
      }
    }
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

      <section className="mt-5 rounded-3xl bg-surface p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">스크린타임 캡처</p>

        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {images.map((src, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden rounded-xl bg-bg">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  aria-label="사진 삭제"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_IMAGES && (
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary-ink">
            + 사진 추가하기 ({images.length}/{MAX_IMAGES})
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFilesAdd} />
          </label>
        )}

        <button
          type="button"
          onClick={runAnalysis}
          disabled={images.length === 0 || analyzing}
          className="mt-3 w-full rounded-xl border border-primary py-2.5 text-sm font-bold text-primary-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint"
        >
          {analyzing ? '분석 중…' : '사진으로 분석하기'}
        </button>

        {missingApps.length > 0 && (
          <div className="mt-3 rounded-xl bg-warn-tint px-3.5 py-3 text-xs font-semibold text-warn-text">
            <span className="font-bold">{missingApps.join(', ')}</span> 사용 시간이 스크린샷에 없어요.{' '}
            <span className="font-bold">{missingApps.join(', ')}</span>이 포함된 스크린샷을 추가로 올리고 다시
            분석해주세요.
          </div>
        )}
      </section>

      <section className="mt-4 rounded-3xl bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">앱별 사용 내역</p>
          <span className="font-display text-sm font-black tabular-nums text-ink">{minutesToLabel(total)}</span>
        </div>

        {apps.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">이 챌린지에 설정된 앱이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {apps.map((app) => (
              <li key={app.name} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-lg">
                  <AppIcon icon={app.icon} className="h-6 w-6" />
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">{app.name}</span>
                <span className="text-sm font-bold tabular-nums text-ink-soft">{minutesToLabel(app.minutes)}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasAnalyzed}
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
