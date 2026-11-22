import { MedusaError } from "@medusajs/framework/utils"

export const AI_RATE_LIMIT_PER_MINUTE = 10
export const AI_RATE_LIMIT_WINDOW_MS = 60_000

type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()

export function checkAiRateLimit(
  actorKey: string,
  now: number = Date.now()
): { allowed: boolean; count: number } {
  const existing = windows.get(actorKey)

  if (!existing || existing.resetAt <= now) {
    windows.set(actorKey, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS })
    return { allowed: true, count: 1 }
  }

  existing.count += 1
  return { allowed: existing.count <= AI_RATE_LIMIT_PER_MINUTE, count: existing.count }
}

export function assertAiRateLimit(actorKey: string): void {
  if (!checkAiRateLimit(actorKey).allowed) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You are sending AI requests too quickly. Please wait a minute and try again."
    )
  }
}

/** Test helper — clear in-process windows between cases. */
export function resetAiRateLimits(): void {
  windows.clear()
}
