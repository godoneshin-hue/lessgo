import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../state/store'
import * as api from '../lib/api'
import { ApiError, type ApiChallenge } from '../lib/api'
import { isFail, verifiedCounts, achievementRate } from '../lib/stats'
import { minutesToLabel, todayISO } from '../lib/date'
import { APP_CATALOG, customAppEntry, toBackgroundStyle } from '../state/seed'
import { findBadge } from '../state/badges'
import Avatar from '../components/Avatar'
import AppIcon from '../components/AppIcon'
import ChallengeAppearancePicker from '../components/ChallengeAppearancePicker'
import VerificationCalendar from '../components/VerificationCalendar'
import { ChevronRightIcon, LinkIcon, XIcon } from '../components/icons'

const CATEGORY_LABEL: Record<string, string> = {
  friends: '친구 대결',
  class: '반대항전',
  school: '학교대항전',
}

const PERIOD_OPTIONS = [1, 3, 5, 7, 14, 30]
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1)

interface AppLimitRow {
  name: string
  icon: string
  minutes: number
}

function failWeekCount(
  records: { date: string; verified: boolean; usedMinutes: number | null }[],
  sinceDate: string,
  threshold: { dailyLimitMinutes: number },
) {
  const startMs = new Date(`${sinceDate}T00:00:00`).getTime()
  const buckets = new Set<number>()
  for (const r of records) {
    if (!isFail(r, threshold)) continue
    const days = Math.floor((new Date(`${r.date}T00:00:00`).getTime() - startMs) / 86400000)
    buckets.add(Math.floor(days / 7))
  }
  return buckets.size
}

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, records, pushToast, refreshChallenges } = useStore()
  const [challenge, setChallenge] = useState<ApiChallenge | null>(null)
  const [equippedBadges, setEquippedBadges] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [title, setTitle] = useState('')
  const [goalHours, setGoalHours] = useState(3)
  const [appLimits, setAppLimits] = useState<AppLimitRow[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customInputOpen, setCustomInputOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [shakingApp, setShakingApp] = useState<string | null>(null)
  const [periodDays, setPeriodDays] = useState(7)
  const [verifyHour12, setVerifyHour12] = useState(10)
  const [verifyMeridiem, setVerifyMeridiem] = useState<'AM' | 'PM'>('PM')
  const [stakeEnabled, setStakeEnabled] = useState(false)
  const [stakeType, setStakeType] = useState<'donation' | 'bet'>('donation')
  const [donationAmount, setDonationAmount] = useState(100)
  const [donationPeriod, setDonationPeriod] = useState<'day' | 'week'>('week')
  const [photo, setPhoto] = useState('')
  const [background, setBackground] = useState('')
  const [memo, setMemo] = useState('')

  function load() {
    if (!id) return
    api
      .getChallenge(id)
      .then(({ challenge }) => setChallenge(challenge))
      .catch(() => setChallenge(null))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  // Equipped badges live on each user's own account, not in the participants
  // snapshot stored on the challenge — fetched separately so it stays fresh
  // instead of going stale the moment someone changes theirs.
  const participantIds = challenge?.participants.map((p) => p.userId).join(',') ?? ''
  useEffect(() => {
    if (!challenge || challenge.participants.length === 0) return
    api
      .getUsersPublic(challenge.participants.map((p) => p.userId))
      .then(({ users }) => setEquippedBadges(Object.fromEntries(users.map((u) => [u.id, u.equippedBadge]))))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantIds])

  if (loading) return <p className="px-5 py-10 text-center text-sm text-ink-faint">불러오는 중…</p>
  if (!challenge) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-ink-soft">챌린지를 찾을 수 없어요.</p>
        <Link to="/challenges" className="mt-3 inline-block text-sm font-bold text-primary-ink">
          챌린지 목록으로
        </Link>
      </div>
    )
  }

  const isGroup = challenge.mode === 'group'
  const isMember = isGroup
    ? challenge.participants.some((p) => p.userId === profile.id)
    : challenge.creatorId === profile.id
  const canEdit = isGroup ? isMember : challenge.creatorId === profile.id
  const isCreator = challenge.creatorId === profile.id

  const threshold = { dailyLimitMinutes: challenge.goalMinutes }
  const sinceDate = challenge.createdAt.slice(0, 10)
  const scoped = records.filter((r) => r.date >= sinceDate)
  const todayRecord = records.find((r) => r.date === todayISO())
  const { successDays, failDays } = verifiedCounts(scoped, threshold)
  const myRate = achievementRate(scoped, threshold, Math.max(scoped.length, 1))
  const myTodayUsed = scoped.find((r) => r.date === sinceDate)?.usedMinutes ?? null

  const pledge =
    challenge.donationPeriod === 'week'
      ? failWeekCount(scoped, sinceDate, threshold) * challenge.donationAmount
      : failDays * challenge.donationAmount

  async function handleJoin() {
    setJoining(true)
    try {
      await api.joinChallenge(profile.id, { challengeId: id })
      pushToast('챌린지에 참여했어요')
      load()
      refreshChallenges()
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '참여하지 못했어요.')
    } finally {
      setJoining(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await api.deleteChallenge(profile.id, id)
      pushToast('챌린지를 삭제했어요')
      refreshChallenges()
      navigate('/challenges')
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '삭제하지 못했어요.')
      setDeleting(false)
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(challenge!.shareCode).catch(() => {})
    pushToast('초대 코드가 복사됐어요')
  }

  function copyLink() {
    const link = `${window.location.origin}/challenges/${challenge!.id}`
    navigator.clipboard?.writeText(link).catch(() => {})
    pushToast('링크가 복사됐어요')
  }

  function startEditing() {
    setTitle(challenge!.title)
    setGoalHours(Math.max(1, Math.round(challenge!.goalMinutes / 60)))
    setAppLimits(challenge!.appLimits.map((a) => ({ name: a.name, icon: a.icon, minutes: a.minutes })))
    setPeriodDays(challenge!.periodDays)
    const h12 = challenge!.verifyByHour % 12 === 0 ? 12 : challenge!.verifyByHour % 12
    setVerifyHour12(h12)
    setVerifyMeridiem(challenge!.verifyByHour >= 12 ? 'PM' : 'AM')
    setStakeEnabled(Boolean(challenge!.stakeType))
    setStakeType(challenge!.stakeType ?? 'donation')
    setDonationAmount(challenge!.donationAmount)
    setDonationPeriod(challenge!.donationPeriod)
    setPhoto(challenge!.photo ?? '')
    setBackground(challenge!.background ?? '')
    setMemo(challenge!.memo ?? '')
    setEditing(true)
  }

  function addAppLimitItem(item: (typeof APP_CATALOG)[number]) {
    setAppLimits((prev) => {
      if (prev.some((a) => a.name === item.name)) return prev
      return [...prev, { ...item, minutes: 60 }]
    })
    setPickerOpen(false)
  }

  function addCustomAppLimit() {
    const name = customName.trim()
    if (!name || appLimits.some((a) => a.name === name)) return
    setAppLimits((prev) => [...prev, { ...customAppEntry(name), minutes: 60 }])
    setCustomName('')
    setCustomInputOpen(false)
    setPickerOpen(false)
  }

  function setAppLimitMinutes(name: string, minutes: number) {
    const clamped = Math.max(0, Math.min(24 * 60, minutes))
    setAppLimits((prev) =>
      prev.map((a) => {
        if (a.name !== name) return a
        if (clamped > goalHours * 60) {
          setShakingApp(name)
          window.setTimeout(() => setShakingApp((cur) => (cur === name ? null : cur)), 2000)
          return a
        }
        return { ...a, minutes: clamped }
      }),
    )
  }

  function removeAppLimit(name: string) {
    setAppLimits((prev) => prev.filter((a) => a.name !== name))
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const verifyByHour = verifyMeridiem === 'AM' ? verifyHour12 % 12 : (verifyHour12 % 12) + 12
      const { challenge: updated } = await api.updateChallenge(profile.id, challenge!.id, {
        title: title.trim(),
        goalMinutes: goalHours * 60,
        periodDays,
        appLimits: appLimits.map((a) => ({ name: a.name, icon: a.icon, minutes: a.minutes })),
        stakeType: stakeEnabled ? stakeType : null,
        donationAmount: stakeEnabled ? donationAmount : 0,
        donationPeriod,
        verifyByHour,
        photo: photo || null,
        background: background || null,
        memo: memo.trim() || null,
      })
      setChallenge(updated)
      setEditing(false)
      pushToast(updated.pendingEdit ? '수정 제안을 보냈어요. 멤버들의 동의를 기다려요.' : '챌린지를 수정했어요')
      refreshChallenges()
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '수정하지 못했어요.')
    } finally {
      setSaving(false)
    }
  }

  async function handleApproveEdit() {
    try {
      const { challenge: updated } = await api.approveChallengeEdit(profile.id, challenge!.id)
      setChallenge(updated)
      pushToast(updated.pendingEdit ? '동의했어요' : '모두 동의해서 수정이 반영됐어요')
      refreshChallenges()
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '처리하지 못했어요.')
    }
  }

  async function handleRejectEdit() {
    try {
      const { challenge: updated } = await api.rejectChallengeEdit(profile.id, challenge!.id)
      setChallenge(updated)
      pushToast('수정 제안을 취소했어요')
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '처리하지 못했어요.')
    }
  }

  if (editing) {
    return (
      <div className="px-5 pb-6 pt-1">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-ink"
            aria-label="취소"
          >
            <ChevronRightIcon className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-base font-extrabold text-ink">챌린지 수정</h1>
          <span className="w-8" />
        </div>

        {isGroup && (
          <p className="mb-4 rounded-xl bg-primary-tint px-3 py-2 text-center text-xs font-semibold text-primary-ink">
            단체 챌린지는 저장 시 모든 멤버의 동의를 받아야 반영돼요.
          </p>
        )}

        <div className="flex flex-col gap-5">
          <section>
            <p className="mb-2.5 text-sm font-bold text-ink">챌린지 꾸미기</p>
            <ChallengeAppearancePicker
              photo={photo}
              onPhoto={setPhoto}
              background={background}
              onBackground={setBackground}
              memo={memo}
              onMemo={setMemo}
            />
          </section>

          <section>
            <p className="mb-2.5 text-sm font-bold text-ink">챌린지 이름</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
            />
          </section>

          <section>
            <p className="mb-2.5 text-sm font-bold text-ink">목표 시간</p>
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
          </section>

          <section>
            <p className="mb-2.5 text-sm font-bold text-ink">특정 앱 사용 시간</p>
            {appLimits.length > 0 && (
              <ul className="mb-2.5 space-y-2">
                {appLimits.map((a) => (
                  <li
                    key={a.name}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                      shakingApp === a.name ? 'animate-shake-invalid border-red-400 bg-red-50' : 'border-line bg-surface'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-base">
                      <AppIcon icon={a.icon} className="h-5 w-5" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">{a.name}</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={Math.floor(a.minutes / 60)}
                        onChange={(e) => setAppLimitMinutes(a.name, Number(e.target.value) * 60 + (a.minutes % 60))}
                        className="rounded-lg border border-line bg-surface py-1.5 text-sm font-bold tabular-nums text-ink"
                      >
                        {Array.from({ length: 25 }, (_, h) => (
                          <option key={h} value={h}>
                            {h}시간
                          </option>
                        ))}
                      </select>
                      <select
                        value={a.minutes % 60}
                        onChange={(e) => setAppLimitMinutes(a.name, Math.floor(a.minutes / 60) * 60 + Number(e.target.value))}
                        className="rounded-lg border border-line bg-surface py-1.5 text-sm font-bold tabular-nums text-ink"
                      >
                        {Array.from({ length: 60 }, (_, m) => (
                          <option key={m} value={m}>
                            {m}분
                          </option>
                        ))}
                      </select>
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
                <div className="mt-2 rounded-2xl border border-line bg-bg p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {APP_CATALOG.filter((c) => !appLimits.some((a) => a.name === c.name)).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => addAppLimitItem(c)}
                        className="flex flex-col items-center gap-1 rounded-xl bg-surface py-2.5 text-[11px] font-semibold text-ink-soft shadow-card active:scale-95"
                      >
                        <AppIcon icon={c.icon} className="h-7 w-7 rounded-lg" />
                        {c.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCustomInputOpen((v) => !v)}
                      className="flex flex-col items-center gap-1 rounded-xl bg-surface py-2.5 text-[11px] font-semibold text-ink-soft shadow-card active:scale-95"
                    >
                      <AppIcon icon="/app-icons/custom.svg" className="h-7 w-7 rounded-lg" />
                      직접입력
                    </button>
                  </div>
                  {customInputOpen && (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="앱 이름 입력"
                        autoFocus
                        className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={addCustomAppLimit}
                        disabled={!customName.trim()}
                        className="rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-50"
                      >
                        추가
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-sm font-bold text-ink">챌린지 기간</p>
            <div className="grid grid-cols-3 gap-2">
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
          </section>

          <section>
            <p className="mb-2.5 text-sm font-bold text-ink">인증 시간</p>
            <div className="flex items-center gap-2">
              <select
                value={verifyHour12}
                onChange={(e) => setVerifyHour12(Number(e.target.value))}
                className="flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-bold text-ink"
              >
                {HOURS_12.map((h) => (
                  <option key={h} value={h}>
                    {h}시
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5">
                {(['AM', 'PM'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setVerifyMeridiem(m)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
                      verifyMeridiem === m ? 'border-primary bg-primary-tint text-primary-ink' : 'border-line text-ink-soft'
                    }`}
                  >
                    {m === 'AM' ? '오전' : '오후'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">기부 · 내기</p>
              <button
                type="button"
                onClick={() => setStakeEnabled((v) => !v)}
                className={`h-6 w-11 shrink-0 rounded-full transition-colors ${stakeEnabled ? 'bg-primary' : 'bg-line'}`}
              >
                <span
                  className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                    stakeEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {stakeEnabled && (
              <div className="mt-2.5 flex flex-col gap-2.5">
                <div className="flex gap-1.5">
                  {(['donation', 'bet'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setStakeType(t)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-bold ${
                        stakeType === t ? 'border-primary bg-primary-tint text-primary-ink' : 'border-line text-ink-soft'
                      }`}
                    >
                      {t === 'donation' ? '기부' : '내기'}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
                />
                <p className="text-[11px] text-ink-faint">실제 돈이 아니라 앱 캐시예요.</p>
                <div className="flex gap-1.5">
                  {(['day', 'week'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDonationPeriod(p)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-bold ${
                        donationPeriod === p ? 'border-primary bg-primary-tint text-primary-ink' : 'border-line text-ink-soft'
                      }`}
                    >
                      실패한 {p === 'day' ? '날마다' : '주마다'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={saving || title.trim().length === 0}
            className="w-full rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
          >
            {saving ? '저장 중…' : isGroup ? '수정 제안 보내기' : '저장하기'}
          </button>
        </div>
      </div>
    )
  }

  const pendingEdit = challenge.pendingEdit
  const iApproved = pendingEdit?.approvedBy.includes(profile.id)

  return (
    <div className="pb-6">
      <div
        className="relative overflow-hidden rounded-b-[32px] bg-gradient-primary px-5 pb-5 pt-safe-t-lg text-white bg-cover bg-center"
        style={challenge.background ? toBackgroundStyle(challenge.background) : undefined}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/challenges')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:text-white"
            aria-label="뒤로 가기"
          >
            <ChevronRightIcon className="h-5 w-5 rotate-180" />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"
            >
              수정
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className="h-14 w-14 shrink-0 rounded-full border-2 border-white/40 bg-cover bg-center shadow-lg"
            style={challenge.photo ? toBackgroundStyle(challenge.photo) : { background: 'rgba(255,255,255,0.2)' }}
          />
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">
              {isGroup ? CATEGORY_LABEL[challenge.category ?? 'friends'] : '개인'}
            </span>
            <h1 className="mt-0.5 truncate text-lg font-black tracking-tight">{challenge.title}</h1>
            <p className="text-xs text-white/85">
              목표 {minutesToLabel(challenge.goalMinutes)} · {challenge.periodDays}일
              {challenge.memo && <> · {challenge.memo}</>}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        {pendingEdit && isMember && (
          <div className="mb-4 rounded-2xl border border-primary bg-primary-tint p-4">
            <p className="text-sm font-bold text-primary-ink">{pendingEdit.proposedByName}님이 수정을 제안했어요</p>
            <p className="mt-1 text-xs text-ink-soft">
              {pendingEdit.approvedBy.length}/{challenge.participants.length}명 동의함
            </p>
            {iApproved ? (
              <p className="mt-2.5 text-xs font-semibold text-ink-soft">다른 멤버들의 동의를 기다리는 중이에요.</p>
            ) : (
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={handleApproveEdit}
                  className="flex-1 rounded-xl bg-primary py-2 text-sm font-bold text-white"
                >
                  동의
                </button>
                <button
                  type="button"
                  onClick={handleRejectEdit}
                  className="flex-1 rounded-xl border border-line py-2 text-sm font-bold text-ink-soft"
                >
                  거절
                </button>
              </div>
            )}
          </div>
        )}

        {isGroup && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-surface p-3 shadow-card">
            <span className="flex-1 pl-2 text-sm font-bold tracking-widest text-ink">{challenge.shareCode}</span>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-xl bg-bg px-3 py-2 text-xs font-bold text-ink-soft hover:text-primary-ink"
            >
              코드 복사
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1 rounded-xl bg-bg px-3 py-2 text-xs font-bold text-ink-soft hover:text-primary-ink"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              링크
            </button>
          </div>
        )}

        {isGroup && !isMember && (
          <div className="mb-4 flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center shadow-card">
            <p className="text-sm font-bold text-ink">아직 참여하지 않았어요</p>
            <p className="text-xs text-ink-soft">참여하면 순위와 진행 상황을 함께 볼 수 있어요.</p>
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="mt-1 rounded-full bg-gradient-primary-soft px-6 py-2.5 text-sm font-extrabold text-white shadow-glow active:scale-95"
            >
              {joining ? '참여하는 중…' : '이 챌린지 참여하기'}
            </button>
          </div>
        )}

        <section className="mb-4 rounded-3xl bg-surface p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">챌린지 정보</p>
          <p className="mt-2 text-sm text-ink-soft">
            매일 <span className="font-bold text-ink">{challenge.verifyByHour}시</span>까지 스크린타임을 인증해요.
          </p>
          {challenge.appLimits.length > 0 && (
            <ul className="mt-3 divide-y divide-line">
              {challenge.appLimits.map((a) => {
                const used = todayRecord?.apps?.find((u) => u.name === a.name)?.minutes
                const over = used !== undefined && used > a.minutes
                return (
                  <li key={a.name} className="flex items-center gap-3 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-base">
                      <AppIcon icon={a.icon} className="h-5 w-5" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">{a.name}</span>
                    <span className="text-sm font-bold tabular-nums text-ink-soft">
                      {used !== undefined && (
                        <span className={over ? 'text-warn-text' : 'text-success-text'}>{minutesToLabel(used)} / </span>
                      )}
                      {minutesToLabel(a.minutes)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {isMember && isGroup && challenge.category === 'friends' && (
          <section className="mb-4 rounded-3xl bg-surface p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">참여자 순위</p>
            <ul className="mt-3 space-y-2">
              {challenge.participants
                .map((p) => {
                  const isMe = p.userId === profile.id
                  return {
                    ...p,
                    rate: isMe ? myRate : (p.ratePercent ?? null),
                    used: isMe ? (myTodayUsed ?? 0) : (p.usedMinutes ?? null),
                    isMe,
                  }
                })
                .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
                .map((p, idx) => (
                  <li
                    key={p.userId}
                    className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${p.isMe ? 'bg-primary-tint' : ''}`}
                  >
                    <span className="w-4 text-center text-xs font-bold text-ink-faint">{idx + 1}</span>
                    <span className="relative shrink-0">
                      <Avatar src={p.avatar} emoji={p.avatarEmoji || '🙂'} size={32} />
                      {findBadge(equippedBadges[p.userId])?.icon && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-surface bg-surface text-[9px] shadow-pop">
                          {findBadge(equippedBadges[p.userId])?.icon}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {p.name}
                        {p.isMe && <span className="ml-1 text-xs font-bold text-primary-ink">(나)</span>}
                      </span>
                      <span className="block text-[11px] text-ink-faint">
                        {p.used !== null ? `${minutesToLabel(p.used)} 사용` : '아직 인증 전'}
                      </span>
                    </span>
                    <span className="text-sm font-bold tabular-nums text-ink">
                      {p.rate !== null ? `${p.rate}%` : '-'}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {isMember && isGroup && challenge.teams && (
          <section className="mb-4 grid grid-cols-2 gap-3">
            {challenge.teams.map((team) => (
              <div key={team.name} className="rounded-3xl bg-surface p-4 text-center shadow-card">
                <p className="text-sm font-bold text-ink">{team.name}</p>
                <p className="mt-1 text-[11px] text-ink-faint">{team.memberCount}명</p>
                <p className="font-display mt-2 text-2xl font-black tabular-nums text-primary-ink">
                  {team.avgRatePercent}%
                </p>
                <p className="mt-0.5 text-[11px] text-ink-soft">평균 {minutesToLabel(team.avgUsedMinutes)}</p>
              </div>
            ))}
          </section>
        )}

        {isMember && (
          <section className="mb-4 rounded-3xl bg-surface p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">내 성과</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-success-tint p-3 text-center">
                <p className="text-xs font-bold text-success-text">달성</p>
                <p className="mt-0.5 text-lg font-black tabular-nums text-success-text">{successDays}일</p>
              </div>
              <div className="rounded-2xl bg-warn-tint p-3 text-center">
                <p className="text-xs font-bold text-warn-text">초과</p>
                <p className="mt-0.5 text-lg font-black tabular-nums text-warn-text">{failDays}일</p>
              </div>
            </div>
          </section>
        )}

        {isMember && <VerificationCalendar records={scoped} threshold={threshold} sinceDate={sinceDate} />}

        {isMember && challenge.stakeType && challenge.donationAmount > 0 && (
          <section className="rounded-3xl bg-surface p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              {challenge.stakeType === 'donation' ? '기부' : '내기'}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {challenge.donationPeriod === 'week' ? '실패한 주마다' : '실패한 날마다'}{' '}
              <span className="font-bold text-ink">{challenge.donationAmount.toLocaleString()}캐시</span>
            </p>
            <p className="font-display mt-2 text-2xl font-black tabular-nums text-warn-text">
              {pledge.toLocaleString()}캐시
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">내가 지금까지 쌓은 캐시예요 (실제 돈 아님)</p>
          </section>
        )}

        {isCreator && (
          <section className="rounded-3xl border border-warn/30 bg-surface p-5">
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full rounded-2xl border border-warn py-3 text-sm font-bold text-warn-text active:scale-[0.99]"
              >
                챌린지 삭제
              </button>
            ) : (
              <div className="space-y-2.5">
                <p className="text-sm font-bold text-warn-text">
                  {isGroup ? '정말 삭제하시겠어요? 참여 중인 모두에게 사라져요.' : '정말 삭제하시겠어요?'} 되돌릴 수
                  없어요.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-bg py-2.5 text-sm font-bold text-ink-soft disabled:opacity-60"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-warn py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {deleting ? '삭제 중…' : '삭제하기'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
