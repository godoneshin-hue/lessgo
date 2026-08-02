import { nanoid } from 'nanoid'
import { db } from './db.js'

// Fire-and-forget: a logging failure should never break the request that
// triggered it.
export function logEvent(type, message, meta = {}) {
  db.addLog({
    id: nanoid(10),
    type,
    message,
    meta,
    createdAt: new Date().toISOString(),
  }).catch((err) => console.error('logEvent failed:', err))
}
