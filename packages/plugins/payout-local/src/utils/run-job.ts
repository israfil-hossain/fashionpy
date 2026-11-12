import { randomUUID } from "crypto"

import { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export type JobStats = Record<string, string | number | null>

type Locking = {
  acquire: (key: string, args: { expire: number; ownerId: string }) => Promise<unknown>
  release: (key: string, args: { ownerId: string }) => Promise<unknown>
}

const LOCK_EXPIRE_SECONDS = 15 * 60

/**
 * Runs one scheduled job under a lock so overlapping ticks skip, logging the
 * stats the run collected. Same shape as the Stripe connector's runner,
 * minus the job-run bookkeeping (this plugin has no module).
 */
export async function runLocalJob(
  container: MedusaContainer,
  job: string,
  run: () => Promise<JobStats>
): Promise<JobStats | null> {
  const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  const lockKey = `payout_local:${job}`
  const ownerId = `${job}:${randomUUID()}`

  let locking: Locking | null = null
  try {
    locking = container.resolve<Locking>(Modules.LOCKING)
  } catch {
    locking = null
  }

  if (locking) {
    try {
      await locking.acquire(lockKey, { expire: LOCK_EXPIRE_SECONDS, ownerId })
    } catch {
      logger.info(`[${job}] skipped, a run is already in progress`)
      return null
    }
  }

  try {
    const stats = await run()
    logger.info(`[${job}] succeeded ${JSON.stringify(stats)}`)
    return stats
  } catch (error) {
    const raw = (error as { message?: unknown } | null)?.message
    logger.error(`[${job}] failed: ${typeof raw === "string" ? raw : String(error)}`)
    return null
  } finally {
    if (locking) {
      try {
        await locking.release(lockKey, { ownerId })
      } catch {
        // The lock expires on its own; a failed release must not fail the job.
      }
    }
  }
}
