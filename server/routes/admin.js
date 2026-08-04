import { Router } from 'express'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'
import { requireAdminPassword } from '../adminAuth.js'

export const adminRouter = Router()

adminRouter.use(requireAdminPassword)

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = (await db.getUsers()).map(({ passwordHash, ...rest }) => rest)
    res.json({ users })
  }),
)

adminRouter.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await db.findUserById(req.params.id)
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없어요.' })
    await db.deleteUser(req.params.id)
    logEvent('admin.delete_user', `관리자가 ${user.name}님 계정을 삭제했어요`, { userId: user.id })
    res.json({ ok: true })
  }),
)

adminRouter.get(
  '/challenges',
  asyncHandler(async (_req, res) => {
    const challenges = await db.getChallenges()
    res.json({ challenges })
  }),
)

adminRouter.delete(
  '/challenges/:id',
  asyncHandler(async (req, res) => {
    const challenge = await db.findChallengeById(req.params.id)
    if (!challenge) return res.status(404).json({ error: '챌린지를 찾을 수 없어요.' })
    await db.deleteChallenge(req.params.id)
    logEvent('admin.delete_challenge', `관리자가 "${challenge.title}" 챌린지를 삭제했어요`, {
      challengeId: challenge.id,
    })
    res.json({ ok: true })
  }),
)

adminRouter.get(
  '/logs',
  asyncHandler(async (_req, res) => {
    res.json({ logs: await db.getLogs() })
  }),
)

adminRouter.get(
  '/verifications',
  asyncHandler(async (_req, res) => {
    res.json({ verifications: await db.getAllVerifications() })
  }),
)

// Deliberately admin-only — see db.deleteVerification for why there is no
// equivalent user-facing route.
adminRouter.delete(
  '/verifications/:id',
  asyncHandler(async (req, res) => {
    const ok = await db.deleteVerification(req.params.id)
    if (!ok) return res.status(404).json({ error: '인증 기록을 찾을 수 없어요.' })
    logEvent('admin.delete_verification', `관리자가 인증 기록을 삭제했어요`, { verificationId: req.params.id })
    res.json({ ok: true })
  }),
)
