const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export class ApiError extends Error {}

let adminPassword: string | null = null

export function setAdminPassword(password: string) {
  adminPassword = password
}

async function request<T>(path: string, options: RequestInit & { userId?: string } = {}): Promise<T> {
  const { userId, headers, ...rest } = options
  const isAdminPath = path.startsWith('/admin')
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(isAdminPath && adminPassword ? { Authorization: `Basic ${btoa(`admin:${adminPassword}`)}` } : {}),
        ...headers,
      },
    })
  } catch {
    throw new ApiError('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.')
  }

  if (isAdminPath && res.status === 401) {
    throw new ApiError('비밀번호가 틀렸어요.')
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(body.error || '요청에 실패했어요.')
  }
  return body as T
}

export interface ApiUser {
  id: string
  name: string
  school: string
  grade: string
  authProvider: 'phone' | 'google' | 'kakao'
  phone: string
  email: string
  oauthId: string | null
  inviteCode: string
  avatar: string
  cash: number
  equippedBadge: string | null
  ownedBadges: string[]
  isPremium: boolean
  createdAt: string
}

export interface ApiPublicUser {
  id: string
  name: string
  avatar: string
  equippedBadge: string | null
}

export function getUsersPublic(ids: string[]) {
  if (ids.length === 0) return Promise.resolve({ users: [] as ApiPublicUser[] })
  return request<{ users: ApiPublicUser[] }>('/auth/users/public', { method: 'POST', body: JSON.stringify({ ids }) })
}

export function buyBadge(userId: string, badgeId: string) {
  return request<{ user: ApiUser }>('/shop/buy', { method: 'POST', userId, body: JSON.stringify({ badgeId }) })
}

export function equipBadge(userId: string, badgeId: string | null) {
  return request<{ user: ApiUser }>('/shop/equip', { method: 'POST', userId, body: JSON.stringify({ badgeId }) })
}

export function createPaymentOrder(userId: string) {
  return request<{ orderId: string; amount: number; orderName: string }>('/payments/order', {
    method: 'POST',
    userId,
  })
}

export function confirmPayment(userId: string, paymentKey: string, orderId: string, amount: number) {
  return request<{ user: ApiUser }>('/payments/confirm', {
    method: 'POST',
    userId,
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })
}

export function socialAuth(payload: {
  provider: 'google' | 'kakao'
  token: string
  name?: string
  school?: string
  grade?: string
  inviteCode?: string
  avatar?: string
}) {
  return request<{ user: ApiUser; isNew: boolean } | { needsProfile: true }>('/auth/social', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function analyzeScreenTime(userId: string, images: string[], trackedAppNames: string[]) {
  const todayLabel = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  return request<{
    isAuthentic: boolean
    totalMinutes: number | null
    apps: { name: string; minutes: number }[]
    hasPerAppBreakdown: boolean
    dateMatches: boolean | null
  }>('/verify/analyze', { method: 'POST', userId, body: JSON.stringify({ images, trackedAppNames, todayLabel }) })
}

export function updateAvatar(userId: string, avatar: string) {
  return request<{ user: ApiUser }>('/auth/me', { method: 'PATCH', userId, body: JSON.stringify({ avatar }) })
}

export function updateProfile(userId: string, patch: { name: string; school: string; grade: string }) {
  return request<{ user: ApiUser }>('/auth/me', { method: 'PATCH', userId, body: JSON.stringify(patch) })
}

export function deleteAccount(userId: string) {
  return request<{ ok: true }>('/auth/me', { method: 'DELETE', userId })
}

export interface ApiParticipant {
  userId: string
  name: string
  avatar?: string
  avatarEmoji?: string
  isCreator: boolean
  isMock?: boolean
  ratePercent?: number
  usedMinutes?: number
  joinedAt: string
}

export interface ApiTeam {
  name: string
  memberCount: number
  avgRatePercent: number
  avgUsedMinutes: number
}

export interface ApiAppLimit {
  name: string
  icon: string
  minutes: number
}

export interface ApiChallenge {
  id: string
  shareCode: string
  creatorId: string
  creatorName: string
  mode: 'solo' | 'group'
  category: 'friends' | 'class' | 'school' | null
  title: string
  goalMinutes: number
  periodDays: number
  startDate: string | null
  endDate: string | null
  maxParticipants: number | null
  openEnrollment: boolean
  stakeType: 'donation' | 'bet' | null
  donationAmount: number
  donationPeriod: 'day' | 'week'
  verifyByHour: number
  appLimits: ApiAppLimit[]
  participants: ApiParticipant[]
  teams: ApiTeam[] | null
  photo: string | null
  background: string | null
  memo: string | null
  pendingEdit: ApiPendingEdit | null
  createdAt: string
}

export interface ApiPendingEdit {
  patch: Partial<
    Pick<
      ApiChallenge,
      'title' | 'goalMinutes' | 'periodDays' | 'startDate' | 'endDate' | 'appLimits' | 'stakeType' | 'donationAmount' | 'donationPeriod' | 'verifyByHour' | 'photo' | 'background' | 'memo'
    >
  >
  proposedBy: string
  proposedByName: string
  approvedBy: string[]
  createdAt: string
}

export function listMyChallenges(userId: string) {
  return request<{ challenges: ApiChallenge[] }>('/challenges/mine', { userId })
}

export function getChallenge(id: string) {
  return request<{ challenge: ApiChallenge }>(`/challenges/${id}`)
}

export function deleteChallenge(userId: string, id: string) {
  return request<{ ok: true }>(`/challenges/${id}`, { method: 'DELETE', userId })
}

export function createChallenge(
  userId: string,
  payload: {
    mode: 'solo' | 'group'
    title: string
    goalMinutes: number
    periodDays: number
    startDate?: string | null
    endDate?: string | null
    maxParticipants: number | null
    openEnrollment: boolean
    stakeEnabled: boolean
    stakeType: 'donation' | 'bet' | null
    donationAmount: number
    donationPeriod: 'day' | 'week'
    verifyByHour: number
    appLimits: ApiAppLimit[]
    photo?: string | null
    background?: string | null
    memo?: string | null
  },
) {
  return request<{ challenge: ApiChallenge }>('/challenges', { method: 'POST', userId, body: JSON.stringify(payload) })
}

export function updateChallenge(userId: string, id: string, patch: ApiPendingEdit['patch']) {
  return request<{ challenge: ApiChallenge }>(`/challenges/${id}`, {
    method: 'PATCH',
    userId,
    body: JSON.stringify(patch),
  })
}

export function approveChallengeEdit(userId: string, id: string) {
  return request<{ challenge: ApiChallenge }>(`/challenges/${id}/pending-edit/approve`, { method: 'POST', userId })
}

export function rejectChallengeEdit(userId: string, id: string) {
  return request<{ challenge: ApiChallenge }>(`/challenges/${id}/pending-edit/reject`, { method: 'POST', userId })
}

export function joinChallenge(userId: string, target: { code?: string; challengeId?: string }) {
  return request<{ challenge: ApiChallenge }>('/challenges/join', {
    method: 'POST',
    userId,
    body: JSON.stringify(target),
  })
}

export function adminGetUsers() {
  return request<{ users: ApiUser[] }>('/admin/users')
}

export function adminDeleteUser(id: string) {
  return request<{ ok: true }>(`/admin/users/${id}`, { method: 'DELETE' })
}

export function adminGetChallenges() {
  return request<{ challenges: ApiChallenge[] }>('/admin/challenges')
}

export function adminDeleteChallenge(id: string) {
  return request<{ ok: true }>(`/admin/challenges/${id}`, { method: 'DELETE' })
}

export interface ApiLog {
  id: string
  type: string
  message: string
  meta: Record<string, string>
  createdAt: string
}

export function adminGetLogs() {
  return request<{ logs: ApiLog[] }>('/admin/logs')
}

export interface ApiVerification {
  id: string
  userId: string
  userName?: string
  date: string
  usedMinutes: number
  apps: ApiAppLimit[]
  createdAt: string
}

export function getVerification(userId: string, date: string) {
  return request<{ verification: ApiVerification | null }>(`/verifications/${date}`, { userId })
}

export function listMyVerifications(userId: string) {
  return request<{ verifications: ApiVerification[] }>('/verifications', { userId })
}

export function submitVerification(userId: string, date: string, usedMinutes: number, apps: ApiAppLimit[]) {
  return request<{ verification: ApiVerification; cashEarned: number; cashTotal: number }>('/verifications', {
    method: 'POST',
    userId,
    body: JSON.stringify({ date, usedMinutes, apps }),
  })
}

export function adminGetVerifications() {
  return request<{ verifications: ApiVerification[] }>('/admin/verifications')
}

export function adminDeleteVerification(id: string) {
  return request<{ ok: true }>(`/admin/verifications/${id}`, { method: 'DELETE' })
}

export type FeedbackCategory = 'design' | 'function' | 'other'

export interface ApiFeedback {
  id: string
  userId: string | null
  userName: string
  category: FeedbackCategory
  message: string
  createdAt: string
}

export function submitFeedback(userId: string, category: FeedbackCategory, message: string) {
  return request<{ feedback: ApiFeedback }>('/feedback', {
    method: 'POST',
    userId,
    body: JSON.stringify({ category, message }),
  })
}

export function adminGetFeedback() {
  return request<{ feedback: ApiFeedback[] }>('/admin/feedback')
}
