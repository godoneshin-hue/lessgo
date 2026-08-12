export interface StreakBadge {
  days: number
  label: string
  icon: string
}

// Ordered ascending — callers that need "the highest tier crossed" should
// scan from the end.
export const STREAK_BADGES: StreakBadge[] = [
  { days: 3, label: '3일 연속', icon: '🔥' },
  { days: 7, label: '일주일 연속', icon: '🥉' },
  { days: 14, label: '2주 연속', icon: '🥈' },
  { days: 30, label: '한 달 연속', icon: '🥇' },
  { days: 100, label: '100일 연속', icon: '🏆' },
]
