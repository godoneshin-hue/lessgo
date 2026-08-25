import { Router, raw } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'
import { analyzeScreenTimeImages } from '../gemini.js'
import { requireUser } from '../requireUser.js'
import { verifyLimiter } from '../rateLimiters.js'

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

// iOS Shortcuts' "URL 콘텐츠 가져오기" action, with its request body set to
// "파일", wraps the file in a multipart/form-data body rather than sending
// raw bytes — regardless of a manually-set Content-Type header. Pulls the
// first image part out of that multipart body by hand (no dependency; this
// is the only place that needs it).
function extractMultipartImage(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '')
  const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null
  if (!boundary) return null

  const marker = Buffer.from(`--${boundary}`)
  const parts = []
  let cursor = buffer.indexOf(marker)
  while (cursor !== -1) {
    const next = buffer.indexOf(marker, cursor + marker.length)
    if (next === -1) break
    parts.push(buffer.slice(cursor + marker.length, next))
    cursor = next
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) continue
    const header = part.slice(0, headerEnd).toString('utf8')
    const typeMatch = /content-type:\s*([^\r\n;]+)/i.exec(header)
    if (!typeMatch || !typeMatch[1].trim().startsWith('image/')) continue

    let body = part.slice(headerEnd + 4)
    if (body.slice(-2).toString('utf8') === '\r\n') body = body.slice(0, -2)
    return { mimeType: typeMatch[1].trim(), data: body }
  }
  return null
}

verifyRouter.post(
  '/analyze',
  verifyLimiter,
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

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
//
// Accepts three body shapes so the Shortcut itself can stay dead simple:
//   1. multipart/form-data with an image part — what Shortcuts' "URL 콘텐츠
//      가져오기" action actually sends when its body is set to "파일",
//      regardless of any Content-Type header set by hand.
//   2. raw image bytes (Content-Type: image/*).
//   3. { images: [dataUrl, ...] } — what the web app itself sends.
verifyRouter.post(
  '/quick',
  verifyLimiter,
  raw({ type: (req) => !req.is('application/json'), limit: '15mb' }),
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    let images
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      const contentType = req.header('content-type') || ''
      if (/multipart\/form-data/i.test(contentType)) {
        const file = extractMultipartImage(req.body, contentType)
        if (file) images = [`data:${file.mimeType};base64,${file.data.toString('base64')}`]
      } else {
        const mimeType = req.is('image/*') || 'image/jpeg'
        images = [`data:${mimeType};base64,${req.body.toString('base64')}`]
      }
    } else {
      images = req.body?.images
    }

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
