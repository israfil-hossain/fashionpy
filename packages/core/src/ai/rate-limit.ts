import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_REDIS_MODULE } from "../modules/messaging-redis"
import type MessagingRedisModuleService from "../modules/messaging-redis/service"

export const AI_RATE_LIMIT_PER_MINUTE = 10
export const AI_RATE_LIMIT_WINDOW_MS = 60_000

type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()

function rateLimitError(): MedusaError {
  return new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    "You are sending AI requests too quickly. Please wait a minute and try again."
  )
}

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

/** In-process fallback used by unit tests and single-instance deployments. */
export function assertAiRateLimit(actorKey: string): void {
  if (!checkAiRateLimit(actorKey).allowed) {
    throw rateLimitError()
  }
}

/**
 * Enforce the per-actor AI budget. Uses the shared Redis window when the
 * messaging-redis module is available so multiple API instances agree; falls
 * back to the in-process window when Redis is missing or erroring.
 */
export async function enforceAiRateLimit(
  container: MedusaContainer,
  actorKey: string
): Promise<void> {
  try {
    const redis = container.resolve<MessagingRedisModuleService>(
      MESSAGING_REDIS_MODULE
    )
    if (redis.isAvailable) {
      const { allowed } = await redis.checkRateLimit(
        `ratelimit:ai:${actorKey}`,
        AI_RATE_LIMIT_PER_MINUTE,
        Math.ceil(AI_RATE_LIMIT_WINDOW_MS / 1000)
      )
      if (!allowed) {
        throw rateLimitError()
      }
      return
    }
  } catch (error) {
    if (error instanceof MedusaError) {
      throw error
    }
    // Redis hiccup — keep enforcing locally instead of failing open.
  }

  assertAiRateLimit(actorKey)
}

/** Test helper — clear in-process windows between cases. */
export function resetAiRateLimits(): void {
  windows.clear()
}