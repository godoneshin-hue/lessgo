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
  inviteCode: string
  avatar: string
  createdAt: string
}

export function signup(payload: {
  authProvider: 'phone' | 'google' | 'kakao'
  name: string
  school: string
  grade: string
  phone?: string
  password?: string
  email?: string
  inviteCode: string
  avatar: string
}) {
  return request<{ user: ApiUser }>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) })
}

export function login(payload: { phone: string; password: string }) {
  return request<{ user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
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

export function updateAvatar(userId: string, avatar: string) {
  return request<{ user: ApiUser }>('/auth/me', { method: 'PATCH', userId, body: JSON.stringify({ avatar }) })
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
  createdAt: string
}

export function listMyChallenges(userId: string) {
  return request<{ challenges: ApiChallenge[] }>('/challenges/mine', { userId })
}

export function getChallenge(id: string) {
  return request<{ challenge: ApiChallenge }>(`/challenges/${id}`)
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
  },
) {
  return request<{ challenge: ApiChallenge }>('/challenges', { method: 'POST', userId, body: JSON.stringify(payload) })
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
