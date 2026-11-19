export const RATE_LIMIT_PER_MINUTE = 20
export const RATE_LIMIT_WINDOW_MS = 60_000
export const RATE_LIMIT_MESSAGE =
  "You are sending messages too quickly. Please wait a moment and try again."

type Window = { count: number; resetAt: number }

// In-process fallback used by unit tests and as a last resort when Redis is
// unavailable for a single instance. Multi-instance deployments rely on the
// Redis Lua INCR path in MessagingRedisModuleService.checkRateLimit.
const windows = new Map<string, Window>()

export function checkChatbotRateLimit(
  actorKey: string,
  now: number = Date.now()
): { allowed: boolean; count: number } {
  const existing = windows.get(actorKey)

  if (!existing || existing.resetAt <= now) {
    windows.set(actorKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, count: 1 }
  }

  existing.count += 1
  return {
    allowed: existing.count <= RATE_LIMIT_PER_MINUTE,
    count: existing.count,
  }
}

/** Test helper — clear in-process windows between cases. */
export function resetChatbotRateLimits(): void {
  windows.clear()
}
