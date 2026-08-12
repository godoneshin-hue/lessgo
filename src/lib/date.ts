const WEEKDAYS_KR = ['일', '월', '화', '수', '목', '금', '토']

export function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Pure Y/M/D arithmetic done entirely in UTC (Date.UTC in, setUTCDate,
// toISOString out) — never mixed with local-time parsing/getters, which is
// what silently shifted every date back by one day for any UTC+ timezone
// (e.g. KST, UTC+9) when this rounded through a local `Date` + `.toISOString()`.
export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export function weekdayKr(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return WEEKDAYS_KR[d.getDay()]
}

export function formatKoreanShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}.${d.getDate()}`
}

export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}
