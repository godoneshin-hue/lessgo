import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'
import { toPublicUser } from './auth.js'

export const paymentsRouter = Router()

// Toss's own public documentation test secret key — safe as a fallback so
// this works out of the box; set TOSS_SECRET_KEY in Render once real
// merchant keys exist (from Toss's 전자결제 신청).
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6'

const PREMIUM_PRICE = 3900

async function requireUser(req, res) {
  const userId = req.header('x-user-id')
  const user = userId && (await db.findUserById(userId))
  if (!user) {
    res.status(401).json({ error: '로그인이 필요해요.' })
    return null
  }
  return user
}

// Called before opening the Toss widget so the amount the client claims to
// charge is pinned server-side — the confirm step below checks the actual
// paid amount against this, so a tampered client request can't pay less
// than the real price for the same orderId.
paymentsRouter.post(
  '/order',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return
    res.json({ orderId: `premium_${nanoid(16)}`, amount: PREMIUM_PRICE, orderName: 'LessGo 프리미엄 (1개월)' })
  }),
)

paymentsRouter.post(
  '/confirm',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const { paymentKey, orderId, amount } = req.body ?? {}
    if (!paymentKey || !orderId || typeof amount !== 'number') {
      return res.status(400).json({ error: '필수 항목이 비어있어요.' })
    }
    if (amount !== PREMIUM_PRICE) {
      return res.status(400).json({ error: '결제 금액이 올바르지 않아요.' })
    }
    if (await db.findPaymentByOrderId(orderId)) {
      return res.status(409).json({ error: '이미 처리된 결제예요.' })
    }

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
    const tossBody = await tossRes.json()
    if (!tossRes.ok) {
      return res.status(400).json({ error: tossBody.message || '결제 승인에 실패했어요.' })
    }

    await db.insertPayment({
      id: nanoid(12),
      userId: user.id,
      orderId,
      paymentKey,
      amount,
      status: 'confirmed',
      raw: tossBody,
      createdAt: new Date().toISOString(),
    })
    const updated = await db.setPremium(user.id, true)
    logEvent('payment.confirm', `${user.name}님이 프리미엄을 결제했어요`, { userId: user.id, orderId, amount })
    res.status(201).json({ user: toPublicUser(updated) })
  }),
)
