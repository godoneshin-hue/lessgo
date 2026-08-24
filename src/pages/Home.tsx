import { Link } from 'react-router-dom'
import { useStore } from '../state/store'
import { achievementRate, currentStreak, isSuccess } from '../lib/stats'
import { minutesToLabel } from '../lib/date'
import { usePersonalChallenge } from '../lib/usePersonalChallenge'
import { DAILY_VERIFY_CASH, findBadge } from '../state/badges'
import { toBackgroundStyle } from '../state/seed'
import ProgressRing from '../components/ProgressRing'
import Avatar from '../components/Avatar'
import { ChevronRightIcon, FlagIcon, SettingsIcon } from '../components/icons'

export default function Home() {
  const { profile, records, todayRecord } = useStore()
  const { challenges, personalChallenge } = usePersonalChallenge()

  const threshold = personalChallenge ? { dailyLimitMinutes: personalChallenge.goalMinutes } : null
  const streak = threshold ? currentStreak(records, threshold) : 0
  const weeklyRate = threshold ? achievementRate(records, threshold, 7) : 0
  const verifiedToday = todayRecord.verified
  const success = threshold && verifiedToday && isSuccess(todayRecord, threshold)

  const otherChallenges = challenges?.filter((c) => c.id !== personalChallenge?.id) ?? []
  const equippedIcon = findBadge(profile.equippedBadge)?.icon

  return (
    <div className="space-y-4 px-5 pb-6 pt-1">
      <div className="flex items-center gap-3">
        <span className="relative shrink-0">
          <Avatar src={profile.avatar} emoji={profile.emoji} size={46} />
          {equippedIcon && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg bg-surface text-xs shadow-pop">
              {equippedIcon}
            </span>
          )}
        </span>
        <div className="flex-1">
          <h1 className="font-display text-[19px] font-extrabold leading-tight text-ink">
            안녕하세요, {profile.name}님
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-soft">오늘도 가볍게, 스크린타임을 지켜봐요.</p>
        </div>
        <Link
          to="/me"
          className="flex shrink-0 items-center gap-1 rounded-full bg-gold-tint px-3 py-1.5 text-xs font-bold text-gold-ink"
        >
          🪙 {profile.cash.toLocaleString()}
        </Link>
      </div>

      {!personalChallenge ? (
        <Link
          to="/challenges/new"
          className="flex items-center gap-3 rounded-3xl bg-surface p-5 shadow-card transition-transform active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary-ink">
            <SettingsIcon className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-ink">아직 개인 챌린지가 없어요</span>
            <span className="block text-xs text-ink-soft">목표 시간을 정하고 나만의 챌린지를 시작해요</span>
          </span>
          <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
        </Link>
      ) : !verifiedToday ? (
        // The one thing this screen actually wants a user to do today — the
        // only section on this page dark enough to read as "act now,"
        // everything else below is calmer/quieter on purpose.
        <section
          className="relative overflow-hidden rounded-3xl bg-ink bg-cover bg-center p-5 text-white shadow-glow"
          style={personalChallenge.background ? toBackgroundStyle(personalChallenge.background) : undefined}
        >
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-white/60">{personalChallenge.title}</p>
              <p className="mt-1 font-display text-2xl font-black tracking-tight text-white">
                {minutesToLabel(personalChallenge.goalMinutes)}{' '}
                <span className="text-base font-bold text-white/70">이내로</span>
              </p>
            </div>
            <Link
              to={`/challenges/${personalChallenge.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:text-white"
              aria-label="개인 챌린지 보기"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
            <div>
              <p className="text-sm font-semibold text-white/80">아직 인증하지 않았어요</p>
              <p className="mt-0.5 text-xs font-bold text-primary-light">🪙 인증하면 캐시 {DAILY_VERIFY_CASH}개 받아요</p>
            </div>
            <Link
              to="/verify"
              className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-primary-deep shadow-glow transition-transform active:scale-95"
            >
              오늘 인증하기
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{personalChallenge.title}</p>
              <p className="mt-1 font-display text-2xl font-black tracking-tight text-primary-ink">
                {minutesToLabel(personalChallenge.goalMinutes)}{' '}
                <span className="text-base font-bold text-ink-soft">이내로</span>
              </p>
            </div>
            <Link
              to={`/challenges/${personalChallenge.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-ink-soft transition-colors hover:text-primary"
              aria-label="개인 챌린지 보기"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-sm font-bold text-ink">오늘 사용 시간 {minutesToLabel(todayRecord.usedMinutes ?? 0)}</p>
              <p className={`mt-0.5 text-[13px] font-semibold ${success ? 'text-success-text' : 'text-warn-text'}`}>
                {success ? '목표 달성! 잘 하고 있어요 🎉' : '목표를 조금 넘었어요'}
              </p>
            </div>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${
                success ? 'bg-success-tint' : 'bg-warn-tint'
              }`}
              aria-hidden
            >
              {success ? '✅' : '⚠️'}
            </span>
          </div>
        </section>
      )}

      {personalChallenge && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-primary p-5 shadow-glow">
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <ProgressRing
              percent={weeklyRate}
              size={82}
              strokeWidth={9}
              gradient={['#FFFFFF', '#BFD9FF']}
              trackColor="rgba(255,255,255,0.25)"
            >
              <span className="font-display text-lg font-black tabular-nums text-white">{weeklyRate}%</span>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-white/70">이번 주 목표 달성률</p>
              <div className="mt-1 flex items-end gap-1.5">
                <span className="font-display text-3xl font-black leading-none tracking-tight text-white">
                  {streak}
                </span>
                <span className="pb-0.5 text-sm font-bold text-white/85">일 연속 🔥</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {otherChallenges.length > 0 ? (
        <Link to="/challenges" className="flex items-center gap-3 rounded-xl px-1 py-2 active:opacity-70">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-tint text-gold-ink">
            <FlagIcon className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-ink">참여 중인 챌린지 {otherChallenges.length}개</span>
            <span className="block text-xs text-ink-soft">{otherChallenges[0].title} 외</span>
          </span>
          <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
        </Link>
      ) : (
        <Link to="/challenges/new" className="flex items-center gap-3 rounded-xl px-1 py-2 active:opacity-70">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-tint text-gold-ink">
            <FlagIcon className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-ink">친구 대결 만들기</span>
            <span className="block text-xs text-ink-soft">혼자서도, 친구들과 함께도 시작할 수 있어요</span>
          </span>
          <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
        </Link>
      )}
    </div>
  )
}
