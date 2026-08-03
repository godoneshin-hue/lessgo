export function requireAdminPassword(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, encoded] = header.split(' ')
  const password = scheme === 'Basic' && encoded ? Buffer.from(encoded, 'base64').toString('utf8').split(':')[1] : null

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="LessGo Admin"')
    return res.status(401).send('인증이 필요해요.')
  }
  next()
}
