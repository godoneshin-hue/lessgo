import type { DayRecord } from '../state/types'
import { addDays } from './date'

interface Threshold {
  dailyLimitMinutes: number
}

export function isSuccess(record: DayRecord, goal: Threshold): boolean {
  return record.verified && record.usedMinutes !== null && record.usedMinutes <= goal.dailyLimitMinutes
}

export function isFail(record: DayRecord, goal: Threshold): boolean {
  return record.verified && record.usedMinutes !== null && record.usedMinutes > goal.dailyLimitMinutes
}

/** Consecutive successful days counting back from the most recent verified day. */
export function currentStreak(records: DayRecord[], goal: Threshold): number {
  const verified = [...records].filter((r) => r.verified).sort((a, b) => (a.date < b.date ? 1 : -1))
  let streak = 0
  for (const r of verified) {
    if (isSuccess(r, goal)) streak += 1
    else break
  }
  return streak
}

/** Success rate over the last N verified days, rounded to the nearest percent. */
export function achievementRate(records: DayRecord[], goal: Threshold, lastNDays = 7): number {
  const window = [...records]
    .filter((r) => r.verified)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, lastNDays)
  if (window.length === 0) return 0
  const successes = window.filter((r) => isSuccess(r, goal)).length
  return Math.round((successes / window.length) * 100)
}

export function verifiedCounts(records: DayRecord[], goal: Threshold, sinceDateExclusive?: string | null) {
  const scoped = sinceDateExclusive ? records.filter((r) => r.date > sinceDateExclusive) : records
  const successDays = scoped.filter((r) => isSuccess(r, goal)).length
  const failDays = scoped.filter((r) => isFail(r, goal)).length
  return { successDays, failDays }
}

/**
 * The longest streak the user has EVER had, anywhere in their history — not
 * just the trailing one from currentStreak(). A streak badge, once earned,
 * shouldn't un-earn itself just because today broke the current streak.
 */
export function bestStreak(records: DayRecord[], goal: Threshold): number {
  const sorted = [...records].sort((a, b) => (a.date < b.date ? -1 : 1))
  let best = 0
  let current = 0
  let prevDate: string | null = null
  for (const r of sorted) {
    if (!isSuccess(r, goal)) {
      current = 0
      prevDate = null
      continue
    }
    current = prevDate && addDays(prevDate, 1) === r.date ? current + 1 : 1
    prevDate = r.date
    best = Math.max(best, current)
  }
  return best
}

export function averageUsage(records: DayRecord[]): number {
  const used = records.filter((r) => r.verified && r.usedMinutes !== null)
  if (used.length === 0) return 0
  const sum = used.reduce((acc, r) => acc + (r.usedMinutes ?? 0), 0)
  return Math.round(sum / used.length)
}
