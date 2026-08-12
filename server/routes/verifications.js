import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'

export const verificationsRouter = Router()

const DAILY_VERIFY_CASH = 10

async function requireUser(req, res) {
  const userId = req.header('x-user-id')
  const user = userId && (await db.findUserById(userId))
  if (!user) {
    res.status(401).json({ error: '로그인이 필요해요.' })
    return null
  }
  return user
}

verificationsRouter.get(
  '/:date',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return
    const verification = await db.findVerification(user.id, req.params.date)
    res.json({ verification })
  }),
)

verificationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const { date, usedMinutes, apps } = req.body ?? {}
    if (!date || typeof usedMinutes !== 'number') {
      return res.status(400).json({ error: '필수 항목이 비어있어요.' })
    }

    // Only the first submission for a given day earns cash — resubmitting
    // (e.g. re-analyzing with a better screenshot) must not pay out twice.
    const existing = await db.findVerification(user.id, date)
    const isFirstSubmit = !existing

    const verification = await db.upsertVerification({
      id: nanoid(12),
      userId: user.id,
      date,
      usedMinutes,
      apps: Array.isArray(apps) ? apps : [],
      createdAt: new Date().toISOString(),
    })

    let cashEarned = 0
    let cashTotal = user.cash
    if (isFirstSubmit) {
      cashEarned = DAILY_VERIFY_CASH
      const updated = await db.addCash(user.id, cashEarned)
      cashTotal = updated.cash
    }

    logEvent('verify.submit', `${user.name}님이 ${date} 인증을 제출했어요`, { userId: user.id })
    res.status(201).json({ verification, cashEarned, cashTotal })
  }),
)
