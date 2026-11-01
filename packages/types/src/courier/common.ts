import { ModuleProviderExports } from "@medusajs/types"

export enum CourierProvider {
  PATHAO = "pathao",
  STEADFAST = "steadfast",
  SYSTEM = "system",
}

export enum CourierAccountStatus {
  /**
   * Credentials saved, validation pending or not yet run
   */
  PENDING = "pending",

  /**
   * Credentials validated against the courier API
   */
  ACTIVE = "active",

  /**
   * Credentials rejected by the courier API
   */
  FAILED = "failed",
}

/**
 * Canonical shipment statuses shared by every provider. Provider-specific
 * raw statuses (Pathao order_status, Steadfast delivery_status) are mapped
 * into this enum so the platform never branches on courier vocabulary.
 */
export enum CourierShipmentStatus {
  PENDING = "pending",
  PICKED_UP = "picked_up",
  IN_TRANSIT = "in_transit",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  RETURNED = "returned",
  CANCELED = "canceled",
  FAILED = "failed",
}

/**
 * Semantic delivery types; each provider maps these onto its own codes
 * (Pathao: 48/12, Steadfast: 0/1).
 */
export enum CourierEvents {
  WebhookReceived = "courier.webhook_received",
}

export enum CourierDeliveryType {
  NORMAL = "normal",
  ON_DEMAND = "on_demand",
  POINT = "point",
}

export interface CourierAccountDTO {
  id: string
  provider: string
  /**
   * Owner of the credentials. `null` marks the platform-level account
   * used for COD bookings (fed from module options / env).
   */
  seller_id: string | null
  status: CourierAccountStatus
  /**
   * Whether this seller offers Cash on Delivery. COD consignments are always
   * booked on the platform account so commission flows through the platform.
   */
  cod_enabled: boolean
  data: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface CourierShipmentDTO {
  id: string
  provider: string
  consignment_id: string
  tracking_code: string | null
  tracking_url: string | null
  status: CourierShipmentStatus
  /**
   * Merchant reference passed to the courier — always the Mercur order id.
   */
  order_id: string
  fulfillment_id: string
  cod_amount: number | null
  delivery_fee: number | null
  currency_code: string | null
  data: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface CourierPlatformCredentials {
  /**
   * Shape matches what the Pathao client expects — passed through verbatim
   * as booking credentials for COD shipments.
   */
  pathao?: {
    client_id: string
    client_secret: string
    username: string
    password: string
    store_id?: number
  }
  steadfast?: {
    apiKey: string
    secretKey: string
    baseUrl?: string
  }
}

export interface CourierModuleOptions {
  /**
   * Providers to be registered
   */
  providers?: {
    resolve: string | ModuleProviderExports
    id: string
    options?: Record<string, unknown>
  }[]

  /**
   * Platform-owned courier credentials (from env) used for COD bookings so
   * COD money is collected by the platform and commission stays automatic.
   */
  platform?: CourierPlatformCredentials
}

export interface CourierWebhookEvent {
  action: "not_supported" | "status.changed"
  provider: string
  consignment_id?: string
  order_id?: string
  status?: CourierShipmentStatus
  delivery_fee?: number
  raw?: Record<string, unknown>
}
