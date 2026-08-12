import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePersistentState } from '../lib/storage'
import { EMPTY_PROFILE, buildEmptyRecords, pickAvatarEmoji } from './seed'
import { todayISO } from '../lib/date'
import * as api from '../lib/api'
import type { ApiChallenge, ApiUser } from '../lib/api'
import type { DayRecord, Profile } from './types'

interface Toast {
  id: number
  message: string
}

function toProfile(user: ApiUser): Profile {
  return {
    id: user.id,
    name: user.name,
    school: user.school,
    grade: user.grade,
    authProvider: user.authProvider,
    phone: user.phone,
    email: user.email,
    inviteCode: user.inviteCode,
    avatar: user.avatar,
    emoji: pickAvatarEmoji(user.name || user.phone || user.email),
  }
}

interface StoreValue {
  isAuthenticated: boolean
  profile: Profile
  signup: (input: {
    authProvider: 'phone' | 'google'
    name: string
    school: string
    grade: string
    phone?: string
    password?: string
    email?: string
    inviteCode: string
    avatar: string
  }) => Promise<void>
  login: (phone: string, password: string) => Promise<void>
  socialAuth: (
    provider: 'google' | 'kakao',
    token: string,
    profileInput?: { name: string; school: string; grade: string; inviteCode: string; avatar: string },
  ) => Promise<{ needsProfile: true } | { needsProfile: false }>
  logout: () => void
  updateAvatar: (avatar: string) => Promise<void>
  justAuthenticated: boolean
  endAuthTransition: () => void
  records: DayRecord[]
  todayRecord: DayRecord
  verifyToday: (usedMinutes: number, apps?: DayRecord['apps']) => void
  unverifyToday: () => void
  toasts: Toast[]
  pushToast: (message: string) => void
  challenges: ApiChallenge[] | null
  refreshChallenges: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = usePersistentState<boolean>('lessgo:isAuthenticated', false)
  const [profile, setProfile] = usePersistentState<Profile>('lessgo:profile', EMPTY_PROFILE)
  const [records, setRecords] = usePersistentState<DayRecord[]>('lessgo:records', buildEmptyRecords())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [justAuthenticated, setJustAuthenticated] = useState(false)
  const [challenges, setChallenges] = useState<ApiChallenge[] | null>(null)

  const today = todayISO()
  const todayRecord = records.find((r) => r.date === today) ?? { date: today, usedMinutes: null, verified: false }

  // Fetched once per login and shared across every page (Home, Verify, Stats,
  // Challenges) instead of each page re-fetching it on every mount — that
  // redundant refetch-on-every-tab-switch was the main cause of the app
  // feeling slow to navigate. Mutation call sites (create/join/edit a
  // challenge) call refreshChallenges() themselves to invalidate this.
  async function refreshChallenges() {
    if (!profile.id) return
    try {
      const { challenges } = await api.listMyChallenges(profile.id)
      setChallenges(challenges)
    } catch {
      // Keep whatever was cached before — a transient failure shouldn't wipe it.
    }
  }

  useEffect(() => {
    if (!profile.id) {
      setChallenges(null)
      return
    }
    refreshChallenges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  function pushToast(message: string) {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }

  async function signup(input: {
    authProvider: 'phone' | 'google'
    name: string
    school: string
    grade: string
    phone?: string
    password?: string
    email?: string
    inviteCode: string
    avatar: string
  }) {
    const { user } = await api.signup(input)
    setProfile(toProfile(user))
    // A brand-new account starts with a completely clean slate — no usage
    // history — regardless of whatever this browser had cached from a
    // previous account.
    setRecords(buildEmptyRecords())
    setIsAuthenticated(true)
    setJustAuthenticated(true)
    pushToast(input.inviteCode ? `${user.name}님, 초대코드가 확인됐어요!` : `${user.name}님, LessGo에 오신 걸 환영해요`)
  }

  async function login(phone: string, password: string) {
    const { user } = await api.login({ phone, password })
    setProfile(toProfile(user))
    setIsAuthenticated(true)
    setJustAuthenticated(true)
    pushToast('다시 만나서 반가워요')
  }

  async function socialAuth(
    provider: 'google' | 'kakao',
    token: string,
    profileInput?: { name: string; school: string; grade: string; inviteCode: string; avatar: string },
  ) {
    const result = await api.socialAuth({ provider, token, ...profileInput })
    if ('needsProfile' in result) return { needsProfile: true as const }

    setProfile(toProfile(result.user))
    if (result.isNew) {
      // Same rule as phone signup: a brand-new account starts with a
      // completely clean slate, not whatever this browser had cached.
      setRecords(buildEmptyRecords())
    }
    setIsAuthenticated(true)
    setJustAuthenticated(true)
    pushToast(result.isNew ? `${result.user.name}님, LessGo에 오신 걸 환영해요` : '다시 만나서 반가워요')
    return { needsProfile: false as const }
  }

  function logout() {
    setIsAuthenticated(false)
  }

  async function updateAvatar(avatar: string) {
    if (!profile.id) return
    const { user } = await api.updateAvatar(profile.id, avatar)
    setProfile(toProfile(user))
  }

  function endAuthTransition() {
    setJustAuthenticated(false)
  }

  function verifyToday(usedMinutes: number, apps?: DayRecord['apps']) {
    setRecords((prev) => {
      const others = prev.filter((r) => r.date !== today)
      return [...others, { date: today, usedMinutes, verified: true, apps }]
    })
  }

  function unverifyToday() {
    setRecords((prev) => {
      const others = prev.filter((r) => r.date !== today)
      return [...others, { date: today, usedMinutes: null, verified: false }]
    })
  }

  const value: StoreValue = {
    isAuthenticated,
    profile,
    signup,
    login,
    socialAuth,
    logout,
    updateAvatar,
    justAuthenticated,
    endAuthTransition,
    records,
    todayRecord,
    verifyToday,
    unverifyToday,
    toasts,
    pushToast,
    challenges,
    refreshChallenges,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
