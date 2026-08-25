import rateLimit from 'express-rate-limit'

// Login is a password-guessing target — keep this the tightest limiter.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '너무 많이 시도했어요. 잠시 후 다시 시도해주세요.' },
})

// Signup/social endpoints are cheaper to spam than login but still worth
// capping so a script can't mass-create accounts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '너무 많이 시도했어요. 잠시 후 다시 시도해주세요.' },
})

// AI screenshot analysis calls the paid Gemini API — without a cap, any
// signed-up account (or anyone who guesses another user's api_key) could
// run up an unbounded bill.
export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '너무 많이 시도했어요. 잠시 후 다시 시도해주세요.' },
})

// Admin surfaces are protected only by a single shared Basic Auth
// password — slow down brute-forcing it.
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '너무 많이 시도했어요. 잠시 후 다시 시도해주세요.' },
})
