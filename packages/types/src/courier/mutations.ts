import { CourierDeliveryType } from "./common"

export interface CreateCourierAccountDTO {
  provider: string
  data: Record<string, unknown>
  cod_enabled?: boolean
  context?: Record<string, unknown>
}

export interface CreateCourierShipmentDTO {
  provider: string
  /**
   * Seller whose account books the shipment. Ignored for COD shipments —
   * those always use the platform credentials.
   */
  seller_id?: string
  order_id: string
  fulfillment_id: string
  recipient_name: string
  recipient_phone: string
  recipient_secondary_phone?: string
  recipient_email?: string
  recipient_address: string
  recipient_city?: string
  recipient_postal_code?: string
  recipient_country_code?: string
  weight: number
  item_count: number
  item_description?: string
  special_instruction?: string
  cod_amount: number
  currency_code: string
  delivery_type?: CourierDeliveryType
}

export interface UpdateCourierShipmentDTO {
  status?: string
  tracking_code?: string | null
  tracking_url?: string | null
  delivery_fee?: number | null
  data?: Record<string, unknown> | null
}
