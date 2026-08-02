// Wraps an async Express handler so a rejected promise (e.g. a DB error)
// becomes a 500 response instead of an unhandled rejection / hung request.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(err)
      if (!res.headersSent) res.status(500).json({ error: '서버 오류가 발생했어요.' })
    })
  }
}
