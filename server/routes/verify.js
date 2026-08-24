import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'
import { analyzeScreenTimeImages } from '../gemini.js'

export const verifyRouter = Router()

const DAILY_VERIFY_CASH = 10
const WEEKDAYS_KR = ['일', '월', '화', '수', '목', '금', '토']

// Pure UTC math (add 9h, read UTC fields) so "today" is always the Korean
// calendar date regardless of the server's own local timezone — same fix as
// the client-side addDays/todayISO bug from earlier (see lib/date.ts).
function todayKST() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return {
    iso: kst.toISOString().slice(0, 10),
    label: `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 ${WEEKDAYS_KR[kst.getUTCDay()]}요일`,
  }
}

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

// One-shot analyze + submit for automations (iOS Shortcuts sharing a
// screenshot straight to this endpoint) that can't run the normal two-step
// Verify.tsx flow — figures out the user's tracked apps itself instead of
// requiring the caller to already know them.
verifyRouter.post(
  '/quick',
  asyncHandler(async (req, res) => {
    const userId = req.header('x-user-id')
    const user = userId && (await db.findUserById(userId))
    if (!user) return res.status(401).json({ error: '로그인이 필요해요.' })

    const { images } = req.body ?? {}
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: '분석할 사진이 없어요.' })
    }
    if (images.length > 10) {
      return res.status(400).json({ error: '사진은 최대 10장까지 업로드할 수 있어요.' })
    }

    const allChallenges = await db.getChallenges()
    const personalChallenge = allChallenges
      .filter((c) => c.mode === 'solo' && c.creatorId === user.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]
    if (!personalChallenge) {
      return res.status(400).json({ error: '먼저 앱에서 개인 챌린지를 만들어주세요.' })
    }

    const trackedAppNames = personalChallenge.appLimits.map((a) => a.name)
    const { iso: date, label: todayLabel } = todayKST()
    const result = await analyzeScreenTimeImages(images, trackedAppNames, todayLabel)

    if (!result.isAuthentic) {
      return res.status(422).json({ error: '스크린타임 설정 화면 스크린샷이 아닌 것 같아요.' })
    }

    const missingNames = trackedAppNames.filter((name) => !result.apps.some((a) => a.name === name))
    if (missingNames.length > 0) {
      return res.status(422).json({ error: `${missingNames.join(', ')} 사용 시간이 스크린샷에 없어요.` })
    }

    const usedMinutes = result.totalMinutes ?? result.apps.reduce((sum, a) => sum + a.minutes, 0)
    const existing = await db.findVerification(user.id, date)
    const isFirstSubmit = !existing

    await db.upsertVerification({
      id: nanoid(12),
      userId: user.id,
      date,
      usedMinutes,
      apps: result.apps,
      createdAt: new Date().toISOString(),
    })

    let cashEarned = 0
    if (isFirstSubmit) {
      cashEarned = DAILY_VERIFY_CASH
      await db.addCash(user.id, cashEarned)
    }

    logEvent('verify.submit', `${user.name}님이 ${date} 인증을 제출했어요 (단축어)`, { userId: user.id })
    res.status(201).json({ usedMinutes, apps: result.apps, cashEarned })
  }),
)
