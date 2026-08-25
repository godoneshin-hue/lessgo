import { timingSafeEqual } from 'node:crypto'

// A plain `!==` leaks how many leading characters of a guess were right
// through response timing. Compare as equal-length buffers instead so a
// wrong guess always takes the same time regardless of where it diverges.
function safeEqual(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA) // keep the false branch's timing close to the true one
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

export function requireAdminPassword(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, encoded] = header.split(' ')
  const password = scheme === 'Basic' && encoded ? Buffer.from(encoded, 'base64').toString('utf8').split(':')[1] : null

  if (!process.env.ADMIN_PASSWORD || !password || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    res.set('WWW-Authenticate', 'Basic realm="LessGo Admin"')
    return res.status(401).send('인증이 필요해요.')
  }
  next()
}
