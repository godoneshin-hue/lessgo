const WEEKDAYS_KR = ['일', '월', '화', '수', '목', '금', '토']

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
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
