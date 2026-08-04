import { todayISO } from '../lib/date'
import type { AppUsage, DayRecord, Profile } from './types'

// A brand-new account has no usage history yet — just today, unverified.
export function buildEmptyRecords(): DayRecord[] {
  return [{ date: todayISO(), usedMinutes: null, verified: false }]
}

export const AVATAR_EMOJIS = ['🐰', '🐱', '🐶', '🐻', '🐯', '🐸', '🐵', '🐹']

export function pickAvatarEmoji(seedText: string): string {
  const hash = Array.from(seedText).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_EMOJIS[hash % AVATAR_EMOJIS.length]
}

export const EMPTY_PROFILE: Profile = {
  id: '',
  name: '',
  school: '',
  grade: '',
  authProvider: 'phone',
  phone: '',
  email: '',
  inviteCode: '',
  emoji: AVATAR_EMOJIS[0],
  avatar: '',
}

export const APP_CATALOG: { name: string; icon: string }[] = [
  { name: '인스타그램', icon: '/app-icons/instagram.svg' },
  { name: '유튜브', icon: '/app-icons/youtube.svg' },
  { name: '틱톡', icon: '/app-icons/tiktok.svg' },
  { name: '카카오톡', icon: '/app-icons/kakaotalk.svg' },
  { name: '넷플릭스', icon: '/app-icons/netflix.svg' },
  { name: '게임', icon: '/app-icons/game.svg' },
  { name: '웹툰', icon: '/app-icons/webtoon.svg' },
  { name: '문자/전화', icon: '/app-icons/phone.svg' },
].sort((a, b) => a.name.localeCompare(b.name, 'ko'))

// Simulates what an OCR pass over a screen-time screenshot would return:
// a plausible, randomized app-by-app breakdown (whole hours) that sums to
// roughly `totalMinutes`.
export function simulateAppBreakdown(totalMinutes: number): AppUsage[] {
  const totalHours = Math.max(1, Math.round(totalMinutes / 60))
  const count = Math.min(totalHours, 3 + Math.floor(Math.random() * 3))
  const chosen = [...APP_CATALOG].sort(() => Math.random() - 0.5).slice(0, count)

  const hours = chosen.map(() => 1)
  let remaining = totalHours - hours.length
  while (remaining > 0) {
    hours[Math.floor(Math.random() * hours.length)] += 1
    remaining -= 1
  }

  const apps = chosen.map((app, i) => ({ ...app, minutes: hours[i] * 60 }))
  return apps.sort((a, b) => b.minutes - a.minutes)
}
