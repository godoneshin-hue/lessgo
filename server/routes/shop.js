import { Router } from 'express'
import { asyncHandler } from '../asyncHandler.js'
import { toPublicUser } from './auth.js'
import { requireUser } from '../requireUser.js'
import { db } from '../db.js'

export const shopRouter = Router()

// Prices live here (not trusted from the client) so a tampered request body
// can't buy a badge for less than it costs.
const SHOP_BADGE_PRICES = {
  'shop-star': 50,
  'shop-crown': 150,
  'shop-diamond': 400,
}

shopRouter.post(
  '/buy',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const { badgeId } = req.body ?? {}
    const price = SHOP_BADGE_PRICES[badgeId]
    if (!price) return res.status(400).json({ error: '존재하지 않는 뱃지예요.' })
    if (user.ownedBadges.includes(badgeId)) return res.status(409).json({ error: '이미 가지고 있는 뱃지예요.' })
    if (user.cash < price) return res.status(400).json({ error: '캐시가 부족해요.' })

    const updated = await db.buyBadge(user.id, badgeId, price)
    if (!updated) return res.status(409).json({ error: '구매하지 못했어요. 다시 시도해주세요.' })
    res.status(201).json({ user: toPublicUser(updated) })
  }),
)

shopRouter.post(
  '/equip',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const { badgeId } = req.body ?? {}
    // Shop badges must actually be owned; streak badges are computed
    // client-side from local verification history so there's nothing here
    // to check them against — same trust level the streak system already
    // has (see plan notes).
    if (badgeId && badgeId.startsWith('shop-') && !user.ownedBadges.includes(badgeId)) {
      return res.status(403).json({ error: '가지고 있지 않은 뱃지예요.' })
    }

    const updated = await db.setEquippedBadge(user.id, badgeId || null)
    res.json({ user: toPublicUser(updated) })
  }),
)
