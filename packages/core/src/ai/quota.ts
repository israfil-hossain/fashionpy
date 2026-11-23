import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type SellerModuleService from "../modules/seller/service"

export const DEFAULT_AI_PRODUCT_QUOTA = 20

export type AiProductQuota = {
  used: number
  quota: number
  remaining: number
}

function toNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null
}

/** Read quota usage out of a seller's `metadata` JSON. */
export function readAiProductQuota(metadata: unknown): AiProductQuota {
  let record: Record<string, unknown> = {}

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata) as unknown
      if (parsed && typeof parsed === "object") {
        record = parsed as Record<string, unknown>
      }
    } catch {
      record = {}
    }
  } else if (metadata && typeof metadata === "object") {
    record = metadata as Record<string, unknown>
  }

  const quota = toNumber(record.ai_product_quota) ?? DEFAULT_AI_PRODUCT_QUOTA
  const used = toNumber(record.ai_product_generations) ?? 0

  return { used, quota, remaining: Math.max(quota - used, 0) }
}

function sellerService(container: MedusaContainer): SellerModuleService {
  return container.resolve<SellerModuleService>(MercurModules.SELLER)
}

/**
 * Atomically reserve one AI product generation for a seller. Throws when the
 * seller has exhausted their quota (admins bypass this by using admin routes).
 */
export async function consumeAiProductCredit(
  container: MedusaContainer,
  sellerId: string
): Promise<AiProductQuota> {
  return sellerService(container).consumeAiProductCredit(sellerId)
}

/** Give a reserved credit back when generation fails. */
export async function refundAiProductCredit(
  container: MedusaContainer,
  sellerId: string
): Promise<void> {
  await sellerService(container).refundAiProductCredit(sellerId)
}

export function quotaExceededError(quota: AiProductQuota): MedusaError {
  return new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    `You have reached your AI product limit (${quota.used}/${quota.quota}). Ask an administrator to raise your quota to generate more.`
  )
}
