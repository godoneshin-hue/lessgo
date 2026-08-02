import { Router } from 'express'
import { nanoid, customAlphabet } from 'nanoid'
import { db } from '../db.js'
import { logEvent } from '../log.js'
import { asyncHandler } from '../asyncHandler.js'

export const challengesRouter = Router()

const shareCodeId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

async function requireUser(req, res) {
  const userId = req.header('x-user-id')
  const user = userId && (await db.findUserById(userId))
  if (!user) {
    res.status(401).json({ error: '로그인이 필요해요.' })
    return null
  }
  return user
}

challengesRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const all = await db.getChallenges()
    const mine = all
      .filter((c) => c.creatorId === user.id || c.participants?.some((p) => p.userId === user.id))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    res.json({ challenges: mine })
  }),
)

challengesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const challenge = await db.findChallengeById(req.params.id)
    if (!challenge) return res.status(404).json({ error: '챌린지를 찾을 수 없어요.' })
    res.json({ challenge })
  }),
)

challengesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const {
      mode,
      category,
      title,
      goalMinutes,
      periodDays,
      startDate,
      endDate,
      maxParticipants,
      openEnrollment,
      stakeEnabled,
      stakeType,
      donationAmount,
      donationPeriod,
      verifyByHour,
      appLimits,
    } = req.body ?? {}

    if (!mode || !title || !periodDays || !goalMinutes) {
      return res.status(400).json({ error: '필수 항목이 비어있어요.' })
    }

    const isGroup = mode === 'group'
    // Only real people ever appear here — a challenge starts with just its
    // creator and grows only when someone actually joins via the share code.
    const participants = isGroup
      ? [
          {
            userId: user.id,
            name: user.name,
            avatar: user.avatar || '',
            isCreator: true,
            joinedAt: new Date().toISOString(),
          },
        ]
      : []

    const hasStake = Boolean(stakeEnabled) && (stakeType === 'donation' || stakeType === 'bet')

    const challenge = {
      id: nanoid(12),
      shareCode: shareCodeId(),
      creatorId: user.id,
      creatorName: user.name,
      mode,
      category: isGroup ? 'friends' : null,
      title,
      goalMinutes,
      periodDays,
      startDate: startDate || null,
      endDate: endDate || null,
      maxParticipants: isGroup ? (maxParticipants ?? null) : null,
      openEnrollment: isGroup ? Boolean(openEnrollment) : false,
      stakeType: hasStake ? stakeType : null,
      donationAmount: hasStake ? (donationAmount ?? 0) : 0,
      donationPeriod: donationPeriod || 'week',
      verifyByHour: typeof verifyByHour === 'number' ? verifyByHour : 22,
      appLimits: Array.isArray(appLimits) ? appLimits : [],
      participants,
      teams: null,
      createdAt: new Date().toISOString(),
    }

    const inserted = await db.insertChallenge(challenge)
    logEvent('challenge.create', `${user.name}님이 "${title}" 챌린지를 만들었어요`, {
      userId: user.id,
      challengeId: challenge.id,
    })
    res.status(201).json({ challenge: inserted })
  }),
)

challengesRouter.post(
  '/join',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const { code, challengeId } = req.body ?? {}
    const challenge = challengeId
      ? await db.findChallengeById(challengeId)
      : await db.findChallengeByShareCode(String(code || '').toUpperCase())
    if (!challenge) return res.status(404).json({ error: '유효하지 않은 챌린지예요.' })

    const alreadyJoined = challenge.participants?.some((p) => p.userId === user.id)
    if (alreadyJoined) return res.json({ challenge })

    const participantCount = challenge.participants?.length ?? 0
    if (challenge.maxParticipants && participantCount >= challenge.maxParticipants) {
      return res.status(409).json({ error: '이미 정원이 가득 찼어요.' })
    }

    const updated = await db.updateChallenge(challenge.id, {
      participants: [
        ...(challenge.participants ?? []),
        {
          userId: user.id,
          name: user.name,
          avatar: user.avatar || '',
          isCreator: false,
          joinedAt: new Date().toISOString(),
        },
      ],
    })

    logEvent('challenge.join', `${user.name}님이 "${challenge.title}" 챌린지에 참여했어요`, {
      userId: user.id,
      challengeId: challenge.id,
    })
    res.json({ challenge: updated })
  }),
)
