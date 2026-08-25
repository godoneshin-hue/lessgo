export interface AppUsage {
  name: string
  icon: string
  minutes: number
}

export interface DayRecord {
  date: string
  usedMinutes: number | null
  verified: boolean
  apps?: AppUsage[]
}

export interface Profile {
  id: string
  apiKey: string
  name: string
  school: string
  grade: string
  authProvider: 'phone' | 'google' | 'kakao'
  phone: string
  email: string
  inviteCode: string
  emoji: string
  avatar: string
  cash: number
  equippedBadge: string | null
  ownedBadges: string[]
  isPremium: boolean
}
