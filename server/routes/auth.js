import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'

export const authRouter = Router()

export function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user
  return publicUser
}

// Never trust a client-supplied identity — always ask the provider's own
// servers to confirm the access token is real (and get who it belongs to)
// before it can create/unlock an account.
async function verifySocialToken(provider, token) {
  if (provider === 'google') {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return { oauthId: `google:${data.sub}`, email: data.email ?? null }
  }
  if (provider === 'kakao') {
    const res = await fetch('https://kapi.kakao.com/v2/user/me', { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const data = await res.json()
    return { oauthId: `kakao:${data.id}`, email: data.kakao_account?.email ?? null }
  }
  return null
}

authRouter.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { authProvider, name, school, grade, phone, password, email, inviteCode, avatar } = req.body ?? {}
    const provider = authProvider === 'google' ? 'google' : 'phone'

    if (!name || !school || !grade) {
      return res.status(400).json({ error: '필수 항목이 비어있어요.' })
    }

    if (provider === 'phone') {
      if (!phone || !password) {
        return res.status(400).json({ error: '전화번호와 비밀번호를 입력해주세요.' })
      }
      if (await db.findUserByPhone(phone)) {
        return res.status(409).json({ error: '이미 가입된 전화번호예요.' })
      }
    } else {
      if (!email) {
        return res.status(400).json({ error: 'Google 계정 정보를 확인하지 못했어요.' })
      }
      if (await db.findUserByEmail(email)) {
        return res.status(409).json({ error: '이미 가입된 Google 계정이에요.' })
      }
    }

    const user = {
      id: nanoid(12),
      name,
      school,
      grade,
      authProvider: provider,
      phone: provider === 'phone' ? phone : '',
      email: provider === 'google' ? email : '',
      passwordHash: provider === 'phone' ? bcrypt.hashSync(password, 10) : null,
      inviteCode: inviteCode || '',
      avatar: avatar || '',
      createdAt: new Date().toISOString(),
    }

    const inserted = await db.insertUser(user)
    logEvent('user.signup', `${name}님이 ${provider === 'google' ? 'Google로 ' : ''}가입했어요`, { userId: user.id })
    res.status(201).json({ user: toPublicUser(inserted) })
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body ?? {}
    if (!phone || !password) {
      return res.status(400).json({ error: '전화번호와 비밀번호를 입력해주세요.' })
    }

    const user = await db.findUserByPhone(phone)
    // Accounts created before authProvider existed have no such field — treat
    // that as 'phone' rather than rejecting a legitimate legacy login.
    const provider = user?.authProvider ?? 'phone'
    if (!user || provider !== 'phone' || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: '전화번호 또는 비밀번호가 올바르지 않아요.' })
    }

    logEvent('user.login', `${user.name}님이 로그인했어요`, { userId: user.id })
    res.json({ user: toPublicUser(user) })
  }),
)

authRouter.post(
  '/social',
  asyncHandler(async (req, res) => {
    const { provider, token, name, school, grade, inviteCode, avatar } = req.body ?? {}
    if (provider !== 'google' && provider !== 'kakao') {
      return res.status(400).json({ error: '지원하지 않는 로그인 방식이에요.' })
    }
    if (!token) {
      return res.status(400).json({ error: '인증 토큰이 없어요.' })
    }

    let identity
    try {
      identity = await verifySocialToken(provider, token)
    } catch {
      identity = null
    }
    if (!identity) {
      return res.status(401).json({ error: '로그인 정보를 확인하지 못했어요. 다시 시도해주세요.' })
    }

    const existing = await db.findUserByOauthId(identity.oauthId)
    if (existing) {
      logEvent('user.login', `${existing.name}님이 ${provider}로 로그인했어요`, { userId: existing.id })
      return res.json({ user: toPublicUser(existing), isNew: false })
    }

    if (!name || !school || !grade) {
      return res.json({ needsProfile: true })
    }

    const user = {
      id: nanoid(12),
      name,
      school,
      grade,
      authProvider: provider,
      phone: '',
      email: identity.email ?? '',
      oauthId: identity.oauthId,
      passwordHash: null,
      inviteCode: inviteCode || '',
      avatar: avatar || '',
      createdAt: new Date().toISOString(),
    }
    const inserted = await db.insertUser(user)
    logEvent('user.signup', `${name}님이 ${provider}로 가입했어요`, { userId: user.id })
    res.status(201).json({ user: toPublicUser(inserted), isNew: true })
  }),
)

// Public, non-sensitive fields for a batch of users — used to show equipped
// badges next to each participant in a group challenge's ranking list.
authRouter.post(
  '/users/public',
  asyncHandler(async (req, res) => {
    const { ids } = req.body ?? {}
    if (!Array.isArray(ids) || ids.length === 0) return res.json({ users: [] })
    const users = await db.findUsersByIds(ids)
    res.json({ users: users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, equippedBadge: u.equippedBadge })) })
  }),
)

authRouter.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const userId = req.header('x-user-id')
    const user = userId && (await db.findUserById(userId))
    if (!user) return res.status(401).json({ error: '로그인이 필요해요.' })

    const { avatar } = req.body ?? {}
    const updated = await db.updateUser(user.id, { avatar: avatar ?? user.avatar })
    res.json({ user: toPublicUser(updated) })
  }),
)
