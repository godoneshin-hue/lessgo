import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../state/store'
import * as api from '../lib/api'
import { ApiError, type ApiChallenge } from '../lib/api'
import { isFail, verifiedCounts, achievementRate } from '../lib/stats'
import { minutesToLabel } from '../lib/date'
import Avatar from '../components/Avatar'
import { ChevronRightIcon, LinkIcon } from '../components/icons'

const CATEGORY_LABEL: Record<string, string> = {
  friends: '친구 대결',
  class: '반대항전',
  school: '학교대항전',
}

function failWeekCount(records: { date: string; verified: boolean; usedMinutes: number | null }[], sinceDate: string, threshold: { dailyLimitMinutes: number }) {
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
  const { profile, records, pushToast } = useStore()
  const [challenge, setChallenge] = useState<ApiChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  function load() {
    if (!id) return
    api
      .getChallenge(id)
      .then(({ challenge }) => setChallenge(challenge))
      .catch(() => setChallenge(null))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

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

  const threshold = { dailyLimitMinutes: challenge.goalMinutes }
  const sinceDate = challenge.createdAt.slice(0, 10)
  const scoped = records.filter((r) => r.date >= sinceDate)
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
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '참여하지 못했어요.')
    } finally {
      setJoining(false)
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

  return (
    <div className="px-5 pb-6 pt-1">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/challenges')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-ink"
          aria-label="뒤로 가기"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isGroup ? 'bg-primary-tint text-primary-ink' : 'bg-line text-ink-soft'
          }`}
        >
          {isGroup ? CATEGORY_LABEL[challenge.category ?? 'friends'] : '개인'}
        </span>
      </div>

      <h1 className="text-xl font-extrabold text-ink">{challenge.title}</h1>
      <p className="mt-1 text-xs text-ink-soft">
        {challenge.periodDays}일 챌린지 · {challenge.creatorName}님이 만듦
        {challenge.goalMinutes && ` · 목표 ${minutesToLabel(challenge.goalMinutes)}`}
      </p>

      {isGroup && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface p-3 shadow-card">
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
        <div className="mt-5 flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center shadow-card">
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

      {isMember && isGroup && challenge.category === 'friends' && (
        <section className="mt-5 rounded-3xl bg-surface p-5 shadow-card">
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
                  <Avatar src={p.avatar} emoji={p.avatarEmoji || '🙂'} size={32} />
                  <span className="flex-1 min-w-0">
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
        <section className="mt-5 grid grid-cols-2 gap-3">
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
        <section className="mt-5 rounded-3xl bg-surface p-5 shadow-card">
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

      {isMember && challenge.stakeType && challenge.donationAmount > 0 && (
        <section className="mt-4 rounded-3xl bg-surface p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
            {challenge.stakeType === 'donation' ? '기부' : '내기'}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {challenge.donationPeriod === 'week' ? '실패한 주마다' : '실패한 날마다'}{' '}
            <span className="font-bold text-ink">{challenge.donationAmount.toLocaleString()}원</span>
          </p>
          <p className="font-display mt-2 text-2xl font-black tabular-nums text-warn-text">
            {pledge.toLocaleString()}원
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">내가 지금까지 쌓은 금액이에요</p>
        </section>
      )}
    </div>
  )
}
