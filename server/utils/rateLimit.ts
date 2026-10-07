const buckets = new Map<string, { count: number; resetAt: number }>()

export const enforceRateLimit = (event: any, key: string, limit = 8, windowMs = 10 * 60 * 1000) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const bucketKey = `${key}:${ip}`
  const now = Date.now()
  const current = buckets.get(bucketKey)

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    return
  }

  if (current.count >= limit) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please try again later.' })
  }

  current.count += 1
}
