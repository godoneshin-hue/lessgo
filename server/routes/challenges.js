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

const EDITABLE_FIELDS = [
  'title',
  'goalMinutes',
  'periodDays',
  'startDate',
  'endDate',
  'appLimits',
  'stakeType',
  'donationAmount',
  'donationPeriod',
  'verifyByHour',
  'photo',
  'background',
  'memo',
]

function pickEditableFields(body) {
  const patch = {}
  for (const key of EDITABLE_FIELDS) {
    if (body && Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key]
  }
  return patch
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
      photo,
      background,
      memo,
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
      photo: photo || null,
      background: background || null,
      memo: memo || null,
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

// Solo challenges apply edits immediately (only the creator can touch them).
// Group challenges instead stage a `pendingEdit` that every participant must
// approve before it actually changes anything.
challengesRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const challenge = await db.findChallengeById(req.params.id)
    if (!challenge) return res.status(404).json({ error: '챌린지를 찾을 수 없어요.' })

    const isGroup = challenge.mode === 'group'
    const isMember = isGroup
      ? challenge.participants?.some((p) => p.userId === user.id)
      : challenge.creatorId === user.id
    if (!isMember) return res.status(403).json({ error: '수정 권한이 없어요.' })

    const patch = pickEditableFields(req.body)

    if (!isGroup) {
      const updated = await db.updateChallengeInfo(challenge.id, patch)
      logEvent('challenge.edit', `${user.name}님이 "${challenge.title}" 챌린지를 수정했어요`, {
        userId: user.id,
        challengeId: challenge.id,
      })
      return res.json({ challenge: updated })
    }

    if (challenge.pendingEdit) {
      return res.status(409).json({ error: '이미 진행 중인 수정 제안이 있어요. 먼저 처리해주세요.' })
    }

    const pendingEdit = {
      patch,
      proposedBy: user.id,
      proposedByName: user.name,
      approvedBy: [user.id],
      createdAt: new Date().toISOString(),
    }
    const updated = await db.setPendingEdit(challenge.id, pendingEdit)
    logEvent('challenge.edit_proposed', `${user.name}님이 "${challenge.title}" 챌린지 수정을 제안했어요`, {
      userId: user.id,
      challengeId: challenge.id,
    })
    res.json({ challenge: updated })
  }),
)

challengesRouter.post(
  '/:id/pending-edit/approve',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const challenge = await db.findChallengeById(req.params.id)
    if (!challenge) return res.status(404).json({ error: '챌린지를 찾을 수 없어요.' })
    if (!challenge.pendingEdit) return res.status(400).json({ error: '진행 중인 수정 제안이 없어요.' })
    const isMember = challenge.participants?.some((p) => p.userId === user.id)
    if (!isMember) return res.status(403).json({ error: '참여자만 동의할 수 있어요.' })

    const approvedBy = Array.from(new Set([...(challenge.pendingEdit.approvedBy ?? []), user.id]))
    const allApproved = challenge.participants.every((p) => approvedBy.includes(p.userId))

    if (allApproved) {
      await db.updateChallengeInfo(challenge.id, challenge.pendingEdit.patch)
      // updateChallengeInfo's own `returning` row still carries the old
      // pending_edit value (it hasn't been cleared yet at that point) — clear
      // it, then re-fetch so the response reflects both changes together.
      const updated = await db.setPendingEdit(challenge.id, null)
      logEvent('challenge.edit_applied', `"${challenge.title}" 챌린지 수정이 모두 동의되어 반영됐어요`, {
        challengeId: challenge.id,
      })
      return res.json({ challenge: updated })
    }

    const updated = await db.setPendingEdit(challenge.id, { ...challenge.pendingEdit, approvedBy })
    res.json({ challenge: updated })
  }),
)

challengesRouter.post(
  '/:id/pending-edit/reject',
  asyncHandler(async (req, res) => {
    const user = await requireUser(req, res)
    if (!user) return

    const challenge = await db.findChallengeById(req.params.id)
    if (!challenge) return res.status(404).json({ error: '챌린지를 찾을 수 없어요.' })
    const isMember = challenge.participants?.some((p) => p.userId === user.id)
    if (!isMember) return res.status(403).json({ error: '참여자만 취소할 수 있어요.' })

    const updated = await db.setPendingEdit(challenge.id, null)
    logEvent('challenge.edit_rejected', `${user.name}님이 "${challenge.title}" 챌린지 수정 제안을 취소했어요`, {
      userId: user.id,
      challengeId: challenge.id,
    })
    res.json({ challenge: updated })
  }),
)
