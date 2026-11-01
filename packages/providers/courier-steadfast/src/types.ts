import { CourierDeliveryType, CourierShipmentStatus } from "@mercurjs/types"

export const STEADFAST_DEFAULT_BASE_URL = "https://portal.packzy.com/api/v1"

export const STEADFAST_DELIVERY_TYPE = {
  // 0 = home delivery, 1 = point/hub pickup
  [CourierDeliveryType.NORMAL]: 0,
  [CourierDeliveryType.ON_DEMAND]: 0,
  [CourierDeliveryType.POINT]: 1,
} as const

export interface SteadfastProviderOptions {
  baseUrl?: string
  /**
   * Bearer token configured in the Steadfast merchant panel's Webhook page.
   * Required to accept webhooks.
   */
  webhookToken?: string
}

export interface SteadfastCredentials {
  apiKey: string
  secretKey: string
}

export class SteadfastApiError extends Error {
  status?: number
  body?: unknown

  constructor(message: string, options?: { status?: number; body?: unknown }) {
    super(message)
    this.name = "SteadfastApiError"
    this.status = options?.status
    this.body = options?.body
  }
}

/**
 * Map Steadfast delivery_status strings onto canonical platform statuses.
 * Order matters — return states and approval-pending variants are checked
 * before their substrings could match a broader bucket.
 * Returns undefined for unknown strings so callers keep the current status.
 */
export function mapSteadfastStatus(
  raw?: string | null
): CourierShipmentStatus | undefined {
  if (!raw) return undefined
  const s = raw.toLowerCase().replace(/[\s-]+/g, "_")

  // "cancelled_return_processing" etc. must hit RETURNED before CANCELED
  if (s.includes("return")) return CourierShipmentStatus.RETURNED
  // Not final: rider reported / partial — keep OUT_FOR_DELIVERY
  if (
    s.includes("partial_delivered") ||
    s.includes("delivered_approval_pending") ||
    s.includes("approval_pending")
  ) {
    return CourierShipmentStatus.OUT_FOR_DELIVERY
  }
  if (s.includes("delivered")) return CourierShipmentStatus.DELIVERED
  if (s.includes("cancel")) return CourierShipmentStatus.CANCELED
  if (s.includes("out_for_delivery")) return CourierShipmentStatus.OUT_FOR_DELIVERY
  if (s.includes("transit") || s.includes("on_hold") || s.includes("hub")) {
    return CourierShipmentStatus.IN_TRANSIT
  }
  if (s.includes("rider_assigned") || s.includes("picked")) {
    return CourierShipmentStatus.PICKED_UP
  }
  if (s.includes("review") || s.includes("pending") || s.includes("created")) {
    return CourierShipmentStatus.PENDING
  }
  return undefined
}

/**
 * Steadfast requires an 11-digit BD mobile (01XXXXXXXXX).
 */
export function normalizeBdPhone(phone: string): string {
  let digits = (phone ?? "").replace(/\D/g, "")
  if (digits.startsWith("880")) digits = digits.slice(3)
  if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`
  return digits
}
