import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../state/store'
import * as api from '../lib/api'
import { ApiError } from '../lib/api'
import { minutesToLabel } from '../lib/date'
import { FlagIcon, LinkIcon } from '../components/icons'

const CATEGORY_LABEL: Record<string, string> = {
  friends: '친구 대결',
  class: '반대항전',
  school: '학교대항전',
}

export default function Challenges() {
  const { profile, pushToast, challenges, refreshChallenges } = useStore()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setJoining(true)
    try {
      const { challenge } = await api.joinChallenge(profile.id, { code: code.trim() })
      pushToast(`"${challenge.title}" 챌린지에 참여했어요`)
      setCode('')
      refreshChallenges()
      navigate(`/challenges/${challenge.id}`)
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '참여하지 못했어요.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="space-y-4 px-5 pb-6 pt-1">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">챌린지</h1>
        <Link
          to="/challenges/new"
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-pop active:scale-95"
        >
          + 새 챌린지
        </Link>
      </div>

      <form onSubmit={handleJoin} className="flex items-center gap-2 rounded-2xl bg-surface p-2 pl-4 shadow-card">
        <LinkIcon className="h-4 w-4 shrink-0 text-ink-faint" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="초대 코드 입력"
          className="flex-1 bg-transparent py-1.5 text-sm font-semibold uppercase tracking-wide text-ink outline-none placeholder:normal-case placeholder:font-normal placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={joining || !code.trim()}
          className="shrink-0 rounded-xl bg-primary-tint px-3 py-2 text-xs font-bold text-primary-ink disabled:opacity-50"
        >
          참여
        </button>
      </form>

      {challenges === null && <p className="py-10 text-center text-sm text-ink-faint">불러오는 중…</p>}

      {challenges?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-8 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-tint text-gold-ink">
            <FlagIcon className="h-6 w-6" />
          </span>
          <p className="text-sm font-bold text-ink">아직 참여한 챌린지가 없어요</p>
          <p className="text-xs text-ink-soft">개인 목표부터 친구 대결까지 만들어보세요.</p>
        </div>
      )}

      <ul className="space-y-3">
        {challenges?.map((c) => (
          <li key={c.id}>
            <Link
              to={`/challenges/${c.id}`}
              className="block rounded-3xl bg-surface p-4 shadow-card transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    c.mode === 'solo' ? 'bg-line text-ink-soft' : 'bg-primary-tint text-primary-ink'
                  }`}
                >
                  {c.mode === 'solo' ? '개인' : CATEGORY_LABEL[c.category ?? 'friends']}
                </span>
                <span className="text-[11px] font-semibold text-ink-faint">{c.periodDays}일</span>
              </div>
              <p className="mt-2 text-base font-extrabold text-ink">{c.title}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
                <span>
                  {c.mode === 'group' && c.category === 'friends' && `참여 ${c.participants.length}명`}
                  {c.mode === 'group' && (c.category === 'class' || c.category === 'school') && c.teams
                    ? `${c.teams[0].name} vs ${c.teams[1].name}`
                    : null}
                  {c.mode === 'solo' && c.goalMinutes && `목표 ${minutesToLabel(c.goalMinutes)}`}
                </span>
                {c.donationAmount > 0 && (
                  <span className="font-bold text-warn-text">
                    {c.donationPeriod === 'week' ? '주' : '일'} {c.donationAmount.toLocaleString()}캐시
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
