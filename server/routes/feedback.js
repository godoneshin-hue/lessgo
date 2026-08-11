import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'

export const feedbackRouter = Router()

const CATEGORIES = ['design', 'function', 'other']

feedbackRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.header('x-user-id')
    const user = userId && (await db.findUserById(userId))
    if (!user) return res.status(401).json({ error: '로그인이 필요해요.' })

    const { category, message } = req.body ?? {}
    if (!CATEGORIES.includes(category) || !message || !String(message).trim()) {
      return res.status(400).json({ error: '필수 항목이 비어있어요.' })
    }

    const feedback = await db.insertFeedback({
      id: nanoid(12),
      userId: user.id,
      userName: user.name,
      category,
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    })
    logEvent('feedback.submit', `${user.name}님이 피드백을 보냈어요`, { userId: user.id, category })
    res.status(201).json({ feedback })
  }),
)
