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

app.listen(PORT, () => {
  console.log(`LessGo API listening on http://localhost:${PORT}`)
})
