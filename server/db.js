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
    passwordHash: row.password_hash,
    inviteCode: row.invite_code,
    avatar: row.avatar,
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
  async findUserById(id) {
    const { rows } = await pool.query('select * from users where id = $1', [id])
    return rowToUser(rows[0])
  },
  async insertUser(user) {
    const { rows } = await pool.query(
      `insert into users (id, name, school, grade, auth_provider, phone, email, password_hash, invite_code, avatar, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       returning *`,
      [
        user.id,
        user.name,
        user.school,
        user.grade,
        user.authProvider,
        user.phone || null,
        user.email || null,
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
         donation_period, verify_by_hour, app_limits, participants, teams, created_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
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
        challenge.createdAt,
      ],
    )
    return rowToChallenge(rows[0])
  },
  async updateChallenge(id, patch) {
    // Only `participants` is ever patched today (join flow) — keep this
    // narrow and explicit rather than building a generic dynamic SET.
    const { rows } = await pool.query(
      `update challenges set participants = $2 where id = $1 returning *`,
      [id, JSON.stringify(patch.participants ?? [])],
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
}
