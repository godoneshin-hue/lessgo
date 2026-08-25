import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePersistentState } from '../lib/storage'
import { EMPTY_PROFILE, buildEmptyRecords, pickAvatarEmoji } from './seed'
import { todayISO } from '../lib/date'
import { applyPwaUpdate, initPwaUpdate } from '../lib/pwaUpdate'
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
    apiKey: user.apiKey,
    name: user.name,
    school: user.school,
    grade: user.grade,
    authProvider: user.authProvider,
    phone: user.phone,
    email: user.email,
    inviteCode: user.inviteCode,
    avatar: user.avatar,
    emoji: pickAvatarEmoji(user.name || user.phone || user.email),
    cash: user.cash,
    equippedBadge: user.equippedBadge,
    ownedBadges: user.ownedBadges,
    isPremium: user.isPremium,
  }
}

interface StoreValue {
  isAuthenticated: boolean
  profile: Profile
  socialAuth: (
    provider: 'google' | 'kakao',
    token: string,
    profileInput?: { name: string; school: string; grade: string; inviteCode: string; avatar: string },
  ) => Promise<{ needsProfile: true } | { needsProfile: false }>
  logout: () => void
  updateAvatar: (avatar: string) => Promise<void>
  updateProfile: (patch: { name: string; school: string; grade: string }) => Promise<void>
  deleteAccount: () => Promise<void>
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
  buyBadge: (badgeId: string) => Promise<void>
  equipBadge: (badgeId: string | null) => Promise<void>
  confirmPayment: (paymentKey: string, orderId: string, amount: number) => Promise<void>
  updateAvailable: boolean
  applyUpdate: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = usePersistentState<boolean>('lessgo:isAuthenticated', false)
  const [profile, setProfile] = usePersistentState<Profile>('lessgo:profile', EMPTY_PROFILE)
  const [records, setRecords] = usePersistentState<DayRecord[]>('lessgo:records', buildEmptyRecords())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [justAuthenticated, setJustAuthenticated] = useState(false)
  const [challenges, setChallenges] = useState<ApiChallenge[] | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    initPwaUpdate(() => setUpdateAvailable(true))
  }, [])

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
      const { challenges } = await api.listMyChallenges(profile.apiKey)
      setChallenges(challenges)
    } catch {
      // A transient failure (e.g. the backend waking up from an idle sleep)
      // shouldn't wipe an already-successful load. But if this was the very
      // first attempt, `challenges` is still null — every page gated on
      // "loading = challenges === null" (Stats, Challenges, Verify) would be
      // stuck on "불러오는 중" forever with no retry. Try again once instead.
      if (challenges === null) {
        window.setTimeout(refreshChallenges, 3000)
      }
    }
  }

  // The server has held every verification since day one (used to award
  // cash, and now to gate premium too), but `records` itself lived only in
  // this browser's localStorage — logging in on a new device, or after an
  // in-app browser (Instagram/Kakao) wipes storage, brought the account and
  // cash back fine but silently reset the streak/history to empty, since
  // nothing ever re-fetched it. Pull it down on every login so the account
  // is what's actually persistent, not this one browser.
  async function refreshRecords() {
    if (!profile.id) return
    try {
      const { verifications } = await api.listMyVerifications(profile.apiKey)
      setRecords(
        verifications.map((v) => ({ date: v.date, usedMinutes: v.usedMinutes, verified: true, apps: v.apps })),
      )
    } catch {
      // Keep whatever's already local rather than blanking out a streak the
      // user can currently see, just because this one fetch failed.
    }
  }

  useEffect(() => {
    if (!profile.id) {
      setChallenges(null)
      return
    }
    refreshChallenges()
    refreshRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  function pushToast(message: string) {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
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
    const { user } = await api.updateAvatar(profile.apiKey, avatar)
    setProfile(toProfile(user))
  }

  async function updateProfile(patch: { name: string; school: string; grade: string }) {
    if (!profile.id) return
    const { user } = await api.updateProfile(profile.apiKey, patch)
    setProfile(toProfile(user))
  }

  async function deleteAccount() {
    if (!profile.id) return
    await api.deleteAccount(profile.apiKey)
    setIsAuthenticated(false)
    setProfile(EMPTY_PROFILE)
    setRecords(buildEmptyRecords())
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

  async function buyBadge(badgeId: string) {
    const { user } = await api.buyBadge(profile.apiKey, badgeId)
    setProfile(toProfile(user))
  }

  async function equipBadge(badgeId: string | null) {
    const { user } = await api.equipBadge(profile.apiKey, badgeId)
    setProfile(toProfile(user))
  }

  async function confirmPayment(paymentKey: string, orderId: string, amount: number) {
    const { user } = await api.confirmPayment(profile.apiKey, paymentKey, orderId, amount)
    setProfile(toProfile(user))
  }

  const value: StoreValue = {
    isAuthenticated,
    profile,
    socialAuth,
    logout,
    updateAvatar,
    updateProfile,
    deleteAccount,
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
    buyBadge,
    equipBadge,
    confirmPayment,
    updateAvailable,
    applyUpdate: applyPwaUpdate,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
