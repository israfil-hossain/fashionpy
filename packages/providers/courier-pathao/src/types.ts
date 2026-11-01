import { CourierDeliveryType, CourierShipmentStatus } from "@mercurjs/types"

export const PATHAO_BASE_URLS = {
  sandbox: "https://courier-api-sandbox.pathao.com",
  live: "https://api-hermes.pathao.com",
} as const

export const PATHAO_DELIVERY_TYPE = {
  [CourierDeliveryType.NORMAL]: 48,
  [CourierDeliveryType.ON_DEMAND]: 12,
  // Pathao has no hub-pickup equivalent — fall back to normal delivery
  [CourierDeliveryType.POINT]: 48,
} as const

export const PATHAO_ITEM_TYPE = {
  DOCUMENT: 1,
  PARCEL: 2,
} as const

export interface PathaoProviderOptions {
  /**
   * true → courier-api-sandbox.pathao.com, false/undefined → api-hermes.pathao.com
   */
  sandbox?: boolean
  baseUrl?: string
}

export interface PathaoCredentials {
  client_id: string
  client_secret: string
  username: string
  password: string
  store_id?: number
}

export class PathaoApiError extends Error {
  status?: number
  code?: number
  body?: unknown

  constructor(message: string, options?: {
    status?: number
    code?: number
    body?: unknown
  }) {
    super(message)
    this.name = "PathaoApiError"
    this.status = options?.status
    this.code = options?.code
    this.body = options?.body
  }
}

/**
 * Map Pathao order_status / webhook event strings onto the canonical
 * platform statuses. Order matters: specific states first.
 * Returns undefined for unknown strings so callers keep the current status.
 */
export function mapPathaoStatus(raw?: string | null): CourierShipmentStatus | undefined {
  if (!raw) return undefined
  const s = raw.toLowerCase().replace(/[\s-]+/g, "_")

  if (s.includes("delivered")) return CourierShipmentStatus.DELIVERED
  if (s.includes("return")) return CourierShipmentStatus.RETURNED
  if (s.includes("cancel")) return CourierShipmentStatus.CANCELED
  if (s.includes("out_for_delivery")) return CourierShipmentStatus.OUT_FOR_DELIVERY
  if (
    s.includes("transit") ||
    s.includes("hub") ||
    s.includes("delivery_requested") ||
    s.includes("invoiced") ||
    s.includes("assigned")
  ) {
    return CourierShipmentStatus.IN_TRANSIT
  }
  if (s.includes("picked")) return CourierShipmentStatus.PICKED_UP
  if (
    s.includes("created") ||
    s.includes("pending") ||
    s.includes("received") ||
    s.includes("in_review")
  ) {
    return CourierShipmentStatus.PENDING
  }
  return undefined
}

/**
 * Pathao requires an 11-digit BD mobile (01XXXXXXXXX).
 */
export function normalizeBdPhone(phone: string): string {
  let digits = (phone ?? "").replace(/\D/g, "")
  if (digits.startsWith("880")) digits = digits.slice(3)
  if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`
  return digits
}
