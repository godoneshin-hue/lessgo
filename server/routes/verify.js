import { Router } from 'express'
import { db } from '../db.js'
import { asyncHandler } from '../asyncHandler.js'
import { analyzeScreenTimeImages } from '../gemini.js'

export const verifyRouter = Router()

verifyRouter.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const userId = req.header('x-user-id')
    const user = userId && (await db.findUserById(userId))
    if (!user) return res.status(401).json({ error: '로그인이 필요해요.' })

    const { images, trackedAppNames, todayLabel } = req.body ?? {}
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: '분석할 사진이 없어요.' })
    }
    if (images.length > 10) {
      return res.status(400).json({ error: '사진은 최대 10장까지 업로드할 수 있어요.' })
    }
    if (!Array.isArray(trackedAppNames)) {
      return res.status(400).json({ error: '추적 중인 앱 목록이 필요해요.' })
    }

    const result = await analyzeScreenTimeImages(
      images,
      trackedAppNames,
      typeof todayLabel === 'string' ? todayLabel : new Date().toISOString().slice(0, 10),
    )
    res.json(result)
  }),
)
