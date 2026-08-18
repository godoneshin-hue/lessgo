import { useState } from 'react'
import { isFail, isSuccess } from '../lib/stats'
import { addDays, todayISO } from '../lib/date'
import type { DayRecord } from '../state/types'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

type DayStatus = 'success' | 'fail' | 'missed' | 'none'

function dayStatus(
  records: DayRecord[],
  date: string,
  threshold: { dailyLimitMinutes: number },
  sinceDate: string,
  today: string,
): DayStatus {
  if (date < sinceDate || date > today) return 'none'
  const record = records.find((r) => r.date === date)
  if (record && isSuccess(record, threshold)) return 'success'
  if (record && isFail(record, threshold)) return 'fail'
  return 'missed'
}

export default function VerificationCalendar({
  records,
  threshold,
  sinceDate,
}: {
  records: DayRecord[]
  threshold: { dailyLimitMinutes: number }
  sinceDate: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const today = todayISO()
  const todayDate = new Date(`${today}T00:00:00`)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, -todayDate.getDay() + i))

  const viewDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + monthOffset, 1)

  const monthDays = (() => {
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const firstIso = firstOfMonth.toISOString().slice(0, 10)
    const startOffset = -firstOfMonth.getDay()
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const totalCells = Math.ceil((daysInMonth - startOffset) / 7) * 7
    return Array.from({ length: totalCells }, (_, i) => addDays(firstIso, startOffset + i))
  })()

  const days = expanded ? monthDays : weekDays

  function toggleExpanded() {
    setMonthOffset(0)
    setExpanded((v) => !v)
  }

  return (
    <section className="mb-4 rounded-3xl bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">인증 캘린더</p>
        <button type="button" onClick={toggleExpanded} className="text-xs font-bold text-primary-ink">
          {expanded ? '이번 주만 보기' : '한 달 보기'}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setMonthOffset((o) => o - 1)}
            aria-label="이전 달"
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft hover:text-primary-ink"
          >
            ◀
          </button>
          <span className="text-xs font-bold tabular-nums text-ink">
            {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
          </span>
          <button
            type="button"
            onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
            disabled={monthOffset >= 0}
            aria-label="다음 달"
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft hover:text-primary-ink disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="text-[11px] font-bold text-ink-faint">
            {w}
          </span>
        ))}
        {days.map((date) => {
          const status = dayStatus(records, date, threshold, sinceDate, today)
          const dayNum = Number(date.slice(8, 10))
          const sameMonth = !expanded || new Date(`${date}T00:00:00`).getMonth() === viewDate.getMonth()
          const isToday = date === today
          return (
            <div key={date} className="flex items-center justify-center py-0.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold tabular-nums transition-colors ${
                  status === 'success'
                    ? 'bg-success text-white'
                    : status === 'fail'
                      ? 'bg-warn text-white'
                      : status === 'missed'
                        ? 'bg-line text-ink-soft'
                        : 'text-ink-faint'
                } ${sameMonth ? '' : 'opacity-30'} ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface' : ''}`}
              >
                {dayNum}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-faint">
        <Legend swatchClass="bg-success" label="달성" />
        <Legend swatchClass="bg-warn" label="초과" />
        <Legend swatchClass="bg-line" label="인증 안 함" />
      </div>
    </section>
  )
}

function Legend({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${swatchClass}`} />
      {label}
    </span>
  )
}
