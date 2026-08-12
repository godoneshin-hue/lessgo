import pg from 'pg'

// DATE columns: return the raw 'YYYY-MM-DD' string instead of a JS Date,
// so there's no timezone-shift risk on a value that has no time component.
pg.types.setTypeParser(1082, (val) => val)

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

function rowToUser(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    school: row.school,
    grade: row.grade,
    authProvider: row.auth_provider,
    phone: row.phone ?? '',
    email: row.email ?? '',
    oauthId: row.oauth_id ?? null,
    passwordHash: row.password_hash,
    inviteCode: row.invite_code,
    avatar: row.avatar,
    cash: row.cash,
    equippedBadge: row.equipped_badge ?? null,
    ownedBadges: row.owned_badges ?? [],
    createdAt: row.created_at.toISOString(),
  }
}

function rowToChallenge(row) {
  if (!row) return null
  return {
    id: row.id,
    shareCode: row.share_code,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    mode: row.mode,
    category: row.category,
    title: row.title,
    goalMinutes: row.goal_minutes,
    periodDays: row.period_days,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    maxParticipants: row.max_participants,
    openEnrollment: row.open_enrollment,
    stakeType: row.stake_type,
    donationAmount: row.donation_amount,
    donationPeriod: row.donation_period,
    verifyByHour: row.verify_by_hour,
    appLimits: row.app_limits ?? [],
    participants: row.participants ?? [],
    teams: row.teams ?? null,
    photo: row.photo ?? null,
    background: row.background ?? null,
    memo: row.memo ?? null,
    pendingEdit: row.pending_edit ?? null,
    createdAt: row.created_at.toISOString(),
  }
}

function rowToLog(row) {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    meta: row.meta ?? {},
    createdAt: row.created_at.toISOString(),
  }
}

function rowToVerification(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name ?? undefined,
    date: row.date,
    usedMinutes: row.used_minutes,
    apps: row.apps ?? [],
    createdAt: row.created_at.toISOString(),
  }
}

function rowToFeedback(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    category: row.category,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  }
}

export const db = {
  async getUsers() {
    const { rows } = await pool.query('select * from users order by created_at desc')
    return rows.map(rowToUser)
  },
  async findUserByPhone(phone) {
    const { rows } = await pool.query('select * from users where phone = $1', [phone])
    return rowToUser(rows[0])
  },
  async findUserByEmail(email) {
    const { rows } = await pool.query('select * from users where email = $1', [email])
    return rowToUser(rows[0])
  },
  async findUserByOauthId(oauthId) {
    const { rows } = await pool.query('select * from users where oauth_id = $1', [oauthId])
    return rowToUser(rows[0])
  },
  async findUserById(id) {
    const { rows } = await pool.query('select * from users where id = $1', [id])
    return rowToUser(rows[0])
  },
  async insertUser(user) {
    const { rows } = await pool.query(
      `insert into users (id, name, school, grade, auth_provider, phone, email, oauth_id, password_hash, invite_code, avatar, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning *`,
      [
        user.id,
        user.name,
        user.school,
        user.grade,
        user.authProvider,
        user.phone || null,
        user.email || null,
        user.oauthId || null,
        user.passwordHash,
        user.inviteCode,
        user.avatar,
        user.createdAt,
      ],
    )
    return rowToUser(rows[0])
  },
  async updateUser(id, patch) {
    const current = await this.findUserById(id)
    if (!current) return null
    const merged = { ...current, ...patch }
    const { rows } = await pool.query(`update users set avatar = $2 where id = $1 returning *`, [id, merged.avatar])
    return rowToUser(rows[0])
  },
  async deleteUser(id) {
    const { rowCount } = await pool.query('delete from users where id = $1', [id])
    return rowCount > 0
  },
  async findUsersByIds(ids) {
    if (ids.length === 0) return []
    const { rows } = await pool.query('select * from users where id = any($1::text[])', [ids])
    return rows.map(rowToUser)
  },
  async addCash(userId, amount) {
    const { rows } = await pool.query(`update users set cash = cash + $2 where id = $1 returning *`, [userId, amount])
    return rowToUser(rows[0])
  },
  // Atomic conditional update: only succeeds if the user still has enough
  // cash and doesn't already own the badge — the route checks these first
  // for a specific error message, this is just the race-safe final guard.
  async buyBadge(userId, badgeId, price) {
    const { rows } = await pool.query(
      `update users set cash = cash - $2, owned_badges = owned_badges || $3::jsonb
       where id = $1 and cash >= $2 and not (owned_badges @> $3::jsonb)
       returning *`,
      [userId, price, JSON.stringify([badgeId])],
    )
    return rowToUser(rows[0])
  },
  async setEquippedBadge(userId, badgeId) {
    const { rows } = await pool.query(`update users set equipped_badge = $2 where id = $1 returning *`, [userId, badgeId])
    return rowToUser(rows[0])
  },

  async getChallenges() {
    const { rows } = await pool.query('select * from challenges order by created_at desc')
    return rows.map(rowToChallenge)
  },
  async findChallengeById(id) {
    const { rows } = await pool.query('select * from challenges where id = $1', [id])
    return rowToChallenge(rows[0])
  },
  async findChallengeByShareCode(code) {
    const { rows } = await pool.query('select * from challenges where share_code = $1', [code])
    return rowToChallenge(rows[0])
  },
  async insertChallenge(challenge) {
    const { rows } = await pool.query(
      `insert into challenges (
         id, share_code, creator_id, creator_name, mode, category, title, goal_minutes, period_days,
         start_date, end_date, max_participants, open_enrollment, stake_type, donation_amount,
         donation_period, verify_by_hour, app_limits, participants, teams, photo, background, memo, created_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       returning *`,
      [
        challenge.id,
        challenge.shareCode,
        challenge.creatorId,
        challenge.creatorName,
        challenge.mode,
        challenge.category,
        challenge.title,
        challenge.goalMinutes,
        challenge.periodDays,
        challenge.startDate,
        challenge.endDate,
        challenge.maxParticipants,
        challenge.openEnrollment,
        challenge.stakeType,
        challenge.donationAmount,
        challenge.donationPeriod,
        challenge.verifyByHour,
        JSON.stringify(challenge.appLimits ?? []),
        JSON.stringify(challenge.participants ?? []),
        challenge.teams ? JSON.stringify(challenge.teams) : null,
        challenge.photo || null,
        challenge.background || null,
        challenge.memo || null,
        challenge.createdAt,
      ],
    )
    return rowToChallenge(rows[0])
  },
  async updateChallenge(id, patch) {
    // Only `participants` is ever patched here (join flow) — keep this
    // narrow and explicit rather than building a generic dynamic SET.
    const { rows } = await pool.query(
      `update challenges set participants = $2 where id = $1 returning *`,
      [id, JSON.stringify(patch.participants ?? [])],
    )
    return rowToChallenge(rows[0])
  },
  async updateChallengeInfo(id, patch) {
    const current = await this.findChallengeById(id)
    if (!current) return null
    const merged = { ...current, ...patch }
    const { rows } = await pool.query(
      `update challenges set
         title = $2, goal_minutes = $3, period_days = $4, start_date = $5, end_date = $6,
         app_limits = $7, stake_type = $8, donation_amount = $9, donation_period = $10,
         verify_by_hour = $11, photo = $12, background = $13, memo = $14
       where id = $1 returning *`,
      [
        id,
        merged.title,
        merged.goalMinutes,
        merged.periodDays,
        merged.startDate,
        merged.endDate,
        JSON.stringify(merged.appLimits ?? []),
        merged.stakeType,
        merged.donationAmount,
        merged.donationPeriod,
        merged.verifyByHour,
        merged.photo || null,
        merged.background || null,
        merged.memo || null,
      ],
    )
    return rowToChallenge(rows[0])
  },
  async setPendingEdit(id, pendingEdit) {
    const { rows } = await pool.query(
      `update challenges set pending_edit = $2 where id = $1 returning *`,
      [id, pendingEdit ? JSON.stringify(pendingEdit) : null],
    )
    return rowToChallenge(rows[0])
  },
  async deleteChallenge(id) {
    const { rowCount } = await pool.query('delete from challenges where id = $1', [id])
    return rowCount > 0
  },

  async getLogs() {
    const { rows } = await pool.query('select * from logs order by created_at desc limit 500')
    return rows.map(rowToLog)
  },
  async addLog(entry) {
    await pool.query(
      `insert into logs (id, type, message, meta, created_at) values ($1,$2,$3,$4,$5)`,
      [entry.id, entry.type, entry.message, JSON.stringify(entry.meta ?? {}), entry.createdAt],
    )
  },

  async findVerification(userId, date) {
    const { rows } = await pool.query('select * from verifications where user_id = $1 and date = $2', [userId, date])
    return rowToVerification(rows[0])
  },
  // Only the day's own owner ever calls this (submitting today's proof) —
  // upsert on (user_id, date) so a retry can't create duplicate rows for
  // the same day.
  async upsertVerification(v) {
    const { rows } = await pool.query(
      `insert into verifications (id, user_id, date, used_minutes, apps, created_at)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (user_id, date) do update set used_minutes = $4, apps = $5
       returning *`,
      [v.id, v.userId, v.date, v.usedMinutes, JSON.stringify(v.apps ?? []), v.createdAt],
    )
    return rowToVerification(rows[0])
  },
  // Deleting a verification is an admin-only action (see admin.js) — there
  // is deliberately no user-facing "cancel my verification" endpoint, so a
  // failed day can't be quietly erased by the person it's about.
  async deleteVerification(id) {
    const { rowCount } = await pool.query('delete from verifications where id = $1', [id])
    return rowCount > 0
  },
  async getVerifications(userId) {
    const { rows } = await pool.query('select * from verifications where user_id = $1 order by date desc', [userId])
    return rows.map(rowToVerification)
  },
  async getAllVerifications() {
    const { rows } = await pool.query(
      `select v.*, u.name as user_name from verifications v
       join users u on u.id = v.user_id
       order by v.date desc, v.created_at desc
       limit 500`,
    )
    return rows.map(rowToVerification)
  },

  async insertFeedback(f) {
    const { rows } = await pool.query(
      `insert into feedback (id, user_id, user_name, category, message, created_at)
       values ($1,$2,$3,$4,$5,$6)
       returning *`,
      [f.id, f.userId, f.userName, f.category, f.message, f.createdAt],
    )
    return rowToFeedback(rows[0])
  },
  async getAllFeedback() {
    const { rows } = await pool.query('select * from feedback order by created_at desc limit 500')
    return rows.map(rowToFeedback)
  },
}
