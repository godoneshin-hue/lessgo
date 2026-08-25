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
  apiKey: '',
  name: '',
  school: '',
  grade: '',
  authProvider: 'phone',
  phone: '',
  email: '',
  inviteCode: '',
  emoji: AVATAR_EMOJIS[0],
  avatar: '',
  cash: 0,
  equippedBadge: null,
  ownedBadges: [],
  isPremium: false,
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

// Default challenge photo/background choices — plain solid/gradient values
// rather than image assets, so there's nothing to host. Uploaded photos are
// data: URLs and backgrounds are linear-gradient(...) strings, so either can
// be told apart from a preset by its prefix.
export const PHOTO_PRESETS = ['#2E5FE8', '#D5451B', '#1F7A4D', '#B8860B', '#6C4CE0', '#C23B3B']

// Presets are solid colors / gradients (usable directly as `background`);
// uploads are data: URLs, which need `background-image: url(...)` instead.
export function toBackgroundStyle(value: string): { background?: string; backgroundImage?: string } {
  if (value.startsWith('data:')) return { backgroundImage: `url(${value})` }
  return { background: value }
}

export const BACKGROUND_PRESETS = [
  'linear-gradient(135deg, #6E93F5 0%, #2E5FE8 55%, #132B7A 100%)',
  'linear-gradient(135deg, #E67A4C 0%, #D5451B 55%, #7A2508 100%)',
  'linear-gradient(135deg, #6FD9A8 0%, #1F7A4D 55%, #0E4A2C 100%)',
  'linear-gradient(135deg, #F3D27A 0%, #B8860B 55%, #6B4E0A 100%)',
  'linear-gradient(135deg, #B39DEF 0%, #6C4CE0 55%, #3D2B99 100%)',
]
