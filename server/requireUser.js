import { db } from './db.js'

// The one place every route trusts a caller's identity — looks the request
// up by its api_key (a server-generated secret only its owner ever sees),
// never by the public `id` a challenge's other participants can also see.
export async function requireUser(req, res) {
  const apiKey = req.header('x-api-key')
  const user = apiKey && (await db.findUserByApiKey(apiKey))
  if (!user) {
    res.status(401).json({ error: '로그인이 필요해요.' })
    return null
  }
  return user
}
