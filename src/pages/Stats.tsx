import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import { useStore } from '../state/store'
import { achievementRate, averageUsage, currentStreak, isSuccess } from '../lib/stats'
import { usePersonalChallenge } from '../lib/usePersonalChallenge'
import { formatKoreanShort, minutesToLabel, weekdayKr } from '../lib/date'
import { ChartIcon } from '../components/icons'

const SUCCESS = '#0CA30C'
const WARN = '#EC835A'
const GRID = '#E3EAF7'
const AXIS_INK = '#898781'

export default function Stats() {
  const { records } = useStore()
  const { personalChallenge, loading } = usePersonalChallenge()
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const threshold = personalChallenge ? { dailyLimitMinutes: personalChallenge.goalMinutes } : null

  const streak = threshold ? currentStreak(records, threshold) : 0
  const weeklyRate = threshold ? achievementRate(records, threshold, 7) : 0
  const avgUsage = averageUsage(records)

  const chartData = useMemo(() => {
    if (!threshold) return []
    return [...records]
      .filter((r) => r.verified)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-14)
      .map((r) => {
        const success = isSuccess(r, threshold)
        return {
          date: r.date,
          minutes: r.usedMinutes ?? 0,
          success,
          fill: success ? SUCCESS : WARN,
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, threshold?.dailyLimitMinutes])

  const yMax = Math.max(threshold?.dailyLimitMinutes ?? 180, ...chartData.map((d) => d.minutes)) + 30

  if (loading) {
    return <p className="px-5 py-10 text-center text-sm text-ink-faint">불러오는 중…</p>
  }

  if (!threshold || chartData.length === 0) {
    return (
      <div className="px-5 pb-6 pt-1">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">통계</h1>
        <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl bg-surface p-8 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary-ink">
            <ChartIcon className="h-6 w-6" />
          </span>
          <p className="text-sm font-bold text-ink">아직 통계가 없어요</p>
          <p className="text-xs text-ink-soft">
            {personalChallenge
              ? '오늘 스크린타임을 인증하면 여기에 기록이 쌓여요.'
              : '개인 챌린지를 만들고 스크린타임을 인증하면 기록이 쌓여요.'}
          </p>
          <Link
            to={personalChallenge ? '/verify' : '/challenges/new'}
            className="mt-1 rounded-full bg-gradient-primary-soft px-5 py-2.5 text-sm font-extrabold text-white shadow-glow active:scale-95"
          >
            {personalChallenge ? '오늘 인증하러 가기' : '개인 챌린지 만들러 가기'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-5 pb-6 pt-1">
      <h1 className="text-lg font-extrabold tracking-tight text-ink">통계</h1>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="평균 사용시간" value={minutesToLabel(avgUsage)} />
        <StatTile label="이번 주 달성률" value={`${weeklyRate}%`} />
        <StatTile label="연속 성공일" value={`${streak}일`} />
      </div>

      <section className="rounded-3xl bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">최근 사용 시간</p>
          <div className="flex rounded-full bg-bg p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setView('chart')}
              className={`rounded-full px-3 py-1 transition-colors ${
                view === 'chart' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
              }`}
            >
              차트
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`rounded-full px-3 py-1 transition-colors ${
                view === 'table' ? 'bg-surface text-primary-ink shadow-sm' : 'text-ink-faint'
              }`}
            >
              표
            </button>
          </div>
        </div>

        {view === 'chart' ? (
          <>
            <div className="mt-3 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => weekdayKr(d)}
                    tick={{ fill: AXIS_INK, fontSize: 11, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={{ stroke: GRID }}
                  />
                  <YAxis
                    domain={[0, yMax]}
                    ticks={[0, 60, 120, 180, 240, 300].filter((t) => t <= yMax)}
                    tick={{ fill: AXIS_INK, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={34}
                    tickFormatter={(v: number) => `${v / 60}h`}
                  />
                  <ReferenceLine
                    y={threshold.dailyLimitMinutes}
                    stroke="#93A1BE"
                    strokeDasharray="4 4"
                    label={{
                      value: `목표 ${minutesToLabel(threshold.dailyLimitMinutes)}`,
                      position: 'insideTopRight',
                      fill: '#5B6B8C',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(20,33,61,0.04)' }} />
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false}>
                    {chartData.map((d) => (
                      <Cell key={d.date} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SUCCESS }} /> 목표 달성
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: WARN }} /> 목표 초과
              </span>
            </div>
          </>
        ) : (
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto no-scrollbar">
            {[...chartData].reverse().map((d) => (
              <div key={d.date} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 text-sm">
                <span className="font-semibold text-ink">
                  {formatKoreanShort(d.date)} ({weekdayKr(d.date)})
                </span>
                <span className="tabular-nums text-ink-soft">{minutesToLabel(d.minutes)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    d.success ? 'bg-success-tint text-success-text' : 'bg-warn-tint text-warn-text'
                  }`}
                >
                  {d.success ? '달성' : '초과'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5 text-center">
      <p className="text-[11px] font-bold text-ink-soft">{label}</p>
      <p className="font-display mt-1 text-lg font-black tabular-nums text-ink">{value}</p>
    </div>
  )
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as { date: string; minutes: number; success: boolean }
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-card">
      <p className="font-bold text-ink">
        {formatKoreanShort(point.date)} ({weekdayKr(point.date)})
      </p>
      <p className="mt-0.5 text-ink-soft">
        {minutesToLabel(point.minutes)} · <span className={point.success ? 'text-success-text' : 'text-warn-text'}>{point.success ? '달성' : '초과'}</span>
      </p>
    </div>
  )
}
