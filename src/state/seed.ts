import { todayISO } from '../lib/date'
import type { DayRecord, Profile } from './types'

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
].sort((a, b) => a.name.localeCompare(b.name, 'ko'))

// A user-typed app name that isn't in the catalog — no matching logo, just
// a generic placeholder glyph.
export function customAppEntry(name: string): { name: string; icon: string } {
  return { name, icon: '/app-icons/custom.svg' }
}
