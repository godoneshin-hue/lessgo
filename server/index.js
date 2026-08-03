import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { challengesRouter } from './routes/challenges.js'
import { adminRouter } from './routes/admin.js'
import { db } from './db.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.use('/api/auth', authRouter)
app.use('/api/challenges', challengesRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/', async (_req, res) => {
  const [users, challenges, logs] = await Promise.all([db.getUsers(), db.getChallenges(), db.getLogs()])
  const uptimeMin = Math.floor(process.uptime() / 60)

  res.type('html').send(`
    <!doctype html>
    <meta charset="utf-8">
    <title>LessGo API</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 36rem; margin: 4rem auto; padding: 0 1.5rem; line-height: 1.6; color: #1a1a1a; }
      .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0; }
      .stat { background: #f4f4f5; border-radius: 12px; padding: 1rem; text-align: center; }
      .stat b { display: block; font-size: 1.8rem; }
      .stat span { font-size: 0.85rem; color: #666; }
      a { color: #2563eb; }
    </style>
    <body>
      <h1>🟢 LessGo API is running</h1>
      <p>가동 시간: ${uptimeMin}분 · Postgres 연결 정상</p>
      <div class="stats">
        <div class="stat"><b>${users.length}</b><span>가입자</span></div>
        <div class="stat"><b>${challenges.length}</b><span>챌린지</span></div>
        <div class="stat"><b>${logs.length}</b><span>최근 로그</span></div>
      </div>
      <p>이 화면은 서버 상태 확인용이에요. 실제 앱은 <a href="https://lessgo-mu.vercel.app">여기</a>서 써주세요.</p>
    </body>
  `)
})

app.listen(PORT, () => {
  console.log(`LessGo API listening on http://localhost:${PORT}`)
})
