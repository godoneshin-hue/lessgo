import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'

export const authRouter = Router()

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user
  return publicUser
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
