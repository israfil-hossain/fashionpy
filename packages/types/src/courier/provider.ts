import {
  CourierDeliveryType,
  CourierShipmentStatus,
} from "./common"

export interface ValidateCourierAccountInput {
  /**
   * Provider credentials as entered by the seller
   */
  data: Record<string, unknown>
}

export interface ValidateCourierAccountResponse {
  valid: boolean
  message?: string
  /**
   * Enriched credentials / provider metadata (e.g. Pathao stores)
   */
  data?: Record<string, unknown>
}

export interface CourierRecipient {
  name: string
  phone: string
  secondary_phone?: string
  email?: string
  address: string
  city?: string
  postal_code?: string
  country_code?: string
}

export interface CourierRateRequest {
  recipient: CourierRecipient
  weight: number
  item_count?: number
  cod_amount?: number
}

export interface CourierRateQuote {
  price: number
  currency_code: string
  eta_description?: string
  raw?: Record<string, unknown>
}

export interface CreateCourierShipmentInput {
  /**
   * Resolved credentials (seller account data or platform env credentials)
   */
  data: Record<string, unknown>
  order_id: string
  fulfillment_id: string
  recipient: CourierRecipient
  weight: number
  item_count: number
  item_description?: string
  special_instruction?: string
  /**
   * Cash to collect on delivery; 0 for prepaid shipments
   */
  cod_amount: number
  currency_code: string
  delivery_type?: CourierDeliveryType
}

export interface CreateCourierShipmentResult {
  consignment_id: string
  tracking_code?: string | null
  tracking_url?: string | null
  status: CourierShipmentStatus
  delivery_fee?: number | null
  raw?: Record<string, unknown>
}

export interface GetCourierShipmentStatusInput {
  data: Record<string, unknown>
  consignment_id: string
  order_id?: string
  tracking_code?: string
}

export interface GetCourierShipmentStatusResult {
  status: CourierShipmentStatus
  updated_at?: string
  raw?: Record<string, unknown>
}

export interface CancelCourierShipmentInput {
  data: Record<string, unknown>
  consignment_id: string
  order_id?: string
}

export interface CancelCourierShipmentResult {
  status: CourierShipmentStatus
  raw?: Record<string, unknown>
}

export interface CourierWebhookInput {
  /**
   * Parsed JSON body
   */
  data: Record<string, unknown>
  /**
   * Exact bytes received — required for signature verification
   */
  rawData: string | Buffer
  headers: Record<string, string>
}

export interface CourierWebhookResult {
  action: "not_supported" | "status.changed"
  consignment_id?: string
  order_id?: string
  status?: CourierShipmentStatus
  delivery_fee?: number
  raw?: Record<string, unknown>
}

/**
 * Contract every courier provider package implements. The module dispatches
 * by the account's `provider` field; credentials always arrive per-call in
 * `data` so the same provider instance serves every seller account.
 *
 * Implementing classes must declare `static identifier: string` (used for
 * container registration and dispatch).
 */
export interface ICourierProvider {
  validateAccount(
    input: ValidateCourierAccountInput
  ): Promise<ValidateCourierAccountResponse>

  /**
   * Live shipping quote for the destination. Return `null` when the provider
   * has no rate API (Steadfast) or the destination can't be resolved — the
   * caller falls back to the seller's flat shipping price.
   */
  getRates(input: CourierRateRequest & { data: Record<string, unknown> }): Promise<CourierRateQuote | null>

  createShipment(
    input: CreateCourierShipmentInput
  ): Promise<CreateCourierShipmentResult>

  getShipmentStatus(
    input: GetCourierShipmentStatusInput
  ): Promise<GetCourierShipmentStatusResult>

  cancelShipment?(
    input: CancelCourierShipmentInput
  ): Promise<CancelCourierShipmentResult>

  getWebhookActionAndData(
    input: CourierWebhookInput
  ): Promise<CourierWebhookResult>
}
