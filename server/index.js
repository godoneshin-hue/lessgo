import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { challengesRouter } from './routes/challenges.js'
import { adminRouter } from './routes/admin.js'
import { verifyRouter } from './routes/verify.js'
import { verificationsRouter } from './routes/verifications.js'
import { feedbackRouter } from './routes/feedback.js'
import { shopRouter } from './routes/shop.js'
import { paymentsRouter } from './routes/payments.js'
import { db } from './db.js'
import { requireAdminPassword } from './adminAuth.js'
import { adminLimiter } from './rateLimiters.js'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function row(cells) {
  return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`
}

const app = express()
const PORT = process.env.PORT || 4000

// Render (and most PaaS hosts) sit behind a reverse proxy — without this,
// every request looks like it comes from that proxy's single IP, so
// express-rate-limit would rate-limit all users together instead of
// per-client.
app.set('trust proxy', 1)

app.use(cors())
app.use(express.json({ limit: '40mb' }))

app.use('/api/auth', authRouter)
app.use('/api/challenges', challengesRouter)
app.use('/api/admin', adminRouter)
app.use('/api/verify', verifyRouter)
app.use('/api/verifications', verificationsRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/shop', shopRouter)
app.use('/api/payments', paymentsRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/', adminLimiter, requireAdminPassword, async (_req, res) => {
  const [users, challenges, logs, verifications, feedback] = await Promise.all([
    db.getUsers(),
    db.getChallenges(),
    db.getLogs(),
    db.getAllVerifications(),
    db.getAllFeedback(),
  ])
  const uptimeMin = Math.floor(process.uptime() / 60)

  res.type('html').send(`
    <!doctype html>
    <meta charset="utf-8">
    <title>LessGo API</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 64rem; margin: 3rem auto; padding: 0 1.5rem; line-height: 1.6; color: #1a1a1a; }
      .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin: 1.5rem 0 2.5rem; }
      .stat { background: #f4f4f5; border-radius: 12px; padding: 1rem; text-align: center; }
      .stat b { display: block; font-size: 1.8rem; }
      .stat span { font-size: 0.85rem; color: #666; }
      a { color: #2563eb; }
      section { margin-bottom: 2.5rem; }
      table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
      th, td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 12rem; }
      th { color: #666; font-weight: 600; }
      .wrap { overflow-x: auto; border: 1px solid #eee; border-radius: 12px; }
    </style>
    <body>
      <h1>🟢 LessGo API</h1>
      <p>가동 시간: ${uptimeMin}분 · Postgres 연결 정상 · 앱은 <a href="https://lessgo-mu.vercel.app">여기</a></p>
      <div class="stats">
        <div class="stat"><b>${users.length}</b><span>가입자</span></div>
        <div class="stat"><b>${challenges.length}</b><span>챌린지</span></div>
        <div class="stat"><b>${verifications.length}</b><span>인증 기록</span></div>
        <div class="stat"><b>${feedback.length}</b><span>피드백</span></div>
        <div class="stat"><b>${logs.length}</b><span>최근 로그</span></div>
      </div>

      <section>
        <h2>가입자 (${users.length})</h2>
        <div class="wrap"><table>
          <tr><th>이름</th><th>학교</th><th>학년</th><th>로그인</th><th>연락처</th><th>가입일</th></tr>
          ${users
            .map((u) =>
              row([
                escapeHtml(u.name),
                escapeHtml(u.school),
                escapeHtml(u.grade),
                escapeHtml(u.authProvider),
                escapeHtml(u.phone || u.email),
                escapeHtml(new Date(u.createdAt).toLocaleString('ko-KR')),
              ]),
            )
            .join('')}
        </table></div>
      </section>

      <section>
        <h2>챌린지 (${challenges.length})</h2>
        <div class="wrap"><table>
          <tr><th>제목</th><th>만든이</th><th>방식</th><th>목표(분)</th><th>참가자</th><th>생성일</th></tr>
          ${challenges
            .map((c) =>
              row([
                escapeHtml(c.title),
                escapeHtml(c.creatorName),
                escapeHtml(c.mode),
                escapeHtml(c.goalMinutes),
                escapeHtml(c.participants?.length ?? 0),
                escapeHtml(new Date(c.createdAt).toLocaleString('ko-KR')),
              ]),
            )
            .join('')}
        </table></div>
      </section>

      <section>
        <h2>인증 기록 (${verifications.length})</h2>
        <div class="wrap"><table>
          <tr><th>사용자</th><th>날짜</th><th>사용 시간</th><th>앱</th></tr>
          ${verifications
            .slice(0, 200)
            .map((v) =>
              row([
                escapeHtml(v.userName ?? v.userId),
                escapeHtml(v.date),
                escapeHtml(`${v.usedMinutes}분`),
                escapeHtml(v.apps.map((a) => `${a.name} ${a.minutes}분`).join(', ') || '—'),
              ]),
            )
            .join('')}
        </table></div>
      </section>

      <section>
        <h2>피드백 (${feedback.length})</h2>
        <div class="wrap"><table>
          <tr><th>보낸 사람</th><th>분류</th><th>내용</th><th>시간</th></tr>
          ${feedback
            .slice(0, 200)
            .map((f) =>
              row([
                escapeHtml(f.userName),
                escapeHtml({ design: '디자인', function: '기능', other: '기타' }[f.category] ?? f.category),
                escapeHtml(f.message),
                escapeHtml(new Date(f.createdAt).toLocaleString('ko-KR')),
              ]),
            )
            .join('')}
        </table></div>
      </section>

      <section>
        <h2>최근 로그 (${logs.length})</h2>
        <div class="wrap"><table>
          <tr><th>종류</th><th>내용</th><th>시간</th></tr>
          ${logs
            .slice(0, 100)
            .map((l) => row([escapeHtml(l.type), escapeHtml(l.message), escapeHtml(new Date(l.createdAt).toLocaleString('ko-KR'))]))
            .join('')}
        </table></div>
      </section>
    </body>
  `)
})

app.listen(PORT, () => {
  console.log(`LessGo API listening on http://localhost:${PORT}`)
})
