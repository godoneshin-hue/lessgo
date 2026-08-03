import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { challengesRouter } from './routes/challenges.js'
import { adminRouter } from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.use('/api/auth', authRouter)
app.use('/api/challenges', challengesRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/', (_req, res) => {
  res.type('html').send(`
    <!doctype html>
    <meta charset="utf-8">
    <title>LessGo API</title>
    <body style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; line-height: 1.6;">
      <h1>🟢 LessGo API is running</h1>
      <p>이 서버는 사람이 볼 화면이 없는 API 전용 백엔드예요. 프론트엔드는 여기서 확인하세요:</p>
      <p><a href="https://lessgo-mu.vercel.app">lessgo-mu.vercel.app</a></p>
      <p><a href="/api/health">/api/health</a></p>
    </body>
  `)
})

app.listen(PORT, () => {
  console.log(`LessGo API listening on http://localhost:${PORT}`)
})
