export interface BadgeDef {
  id: string
  label: string
  icon: string
  kind: 'streak' | 'shop'
  days?: number
  price?: number
}

// Auto-unlocked by hitting a best-ever streak length (see lib/stats.ts
// bestStreak) — free, no purchase involved.
export const STREAK_BADGES: BadgeDef[] = [
  { id: 'streak-3', kind: 'streak', days: 3, label: '3일 연속', icon: '🔥' },
  { id: 'streak-7', kind: 'streak', days: 7, label: '일주일 연속', icon: '🥉' },
  { id: 'streak-14', kind: 'streak', days: 14, label: '2주 연속', icon: '🥈' },
  { id: 'streak-30', kind: 'streak', days: 30, label: '한 달 연속', icon: '🥇' },
  { id: 'streak-100', kind: 'streak', days: 100, label: '100일 연속', icon: '🏆' },
]

// Purchasable with cash earned from daily verification — cosmetic only.
export const SHOP_BADGES: BadgeDef[] = [
  { id: 'shop-star', kind: 'shop', price: 50, label: '별', icon: '⭐' },
  { id: 'shop-crown', kind: 'shop', price: 150, label: '왕관', icon: '👑' },
  { id: 'shop-diamond', kind: 'shop', price: 400, label: '다이아', icon: '💎' },
]

export const ALL_BADGES: BadgeDef[] = [...STREAK_BADGES, ...SHOP_BADGES]

export function findBadge(id: string | null | undefined): BadgeDef | undefined {
  if (!id) return undefined
  return ALL_BADGES.find((b) => b.id === id)
}

export const DAILY_VERIFY_CASH = 10
