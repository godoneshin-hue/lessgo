import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await pool.query(sql)
  console.log('schema applied ok')

  // Backfill api_key for accounts created before that column existed —
  // one at a time so each row gets its own random value (a single UPDATE
  // with one literal would give every row the same key).
  const { rows } = await pool.query('select id from users where api_key is null')
  for (const { id } of rows) {
    await pool.query('update users set api_key = $2 where id = $1', [id, randomBytes(32).toString('base64url')])
  }
  if (rows.length > 0) console.log(`backfilled api_key for ${rows.length} user(s)`)
} finally {
  await pool.end()
}
