import {
  CancelCourierShipmentInput,
  CancelCourierShipmentResult,
  CourierRateQuote,
  CourierRateRequest,
  CourierShipmentStatus,
  CourierWebhookInput,
  CourierWebhookResult,
  CreateCourierShipmentInput,
  CreateCourierShipmentResult,
  GetCourierShipmentStatusInput,
  GetCourierShipmentStatusResult,
  ICourierProvider,
  ValidateCourierAccountInput,
  ValidateCourierAccountResponse,
} from "@mercurjs/types"

import { PathaoClient } from "../client"
import {
  PathaoApiError,
  PathaoProviderOptions,
  mapPathaoStatus,
} from "../types"

export class PathaoCourierProvider implements ICourierProvider {
  static identifier = "pathao"
  static LIFE_TIME = "SCOPED"

  protected readonly client_: PathaoClient

  constructor(_cradle: unknown, options: PathaoProviderOptions = {}) {
    this.client_ = new PathaoClient(options)
  }

  async validateAccount(
    input: ValidateCourierAccountInput
  ): Promise<ValidateCourierAccountResponse> {
    try {
      const { stores } = await this.client_.validate(
        input.data as Record<string, unknown> as any
      )
      return { valid: true, data: { stores } }
    } catch (error) {
      if (error instanceof PathaoApiError) {
        if (error.status === 0) throw error // network/timeout — not a credential verdict
        if (error.status && error.status >= 500) throw error
        return { valid: false, message: error.message }
      }
      throw error
    }
  }

  /**
   * Best-effort quote: any Pathao failure falls back to the seller's flat
   * rate (null) instead of breaking checkout.
   */
  async getRates(
    input: CourierRateRequest & { data: Record<string, unknown> }
  ): Promise<CourierRateQuote | null> {
    try {
      return await this.client_.getRates(
        input.data as any,
        input
      )
    } catch {
      return null
    }
  }

  async createShipment(
    input: CreateCourierShipmentInput
  ): Promise<CreateCourierShipmentResult> {
    return await this.client_.createShipment(input.data as any, input)
  }

  async getShipmentStatus(
    input: GetCourierShipmentStatusInput
  ): Promise<GetCourierShipmentStatusResult> {
    const res = await this.client_.getStatus(
      input.data as any,
      input.consignment_id
    )
    return {
      status: res.status ?? CourierShipmentStatus.PENDING,
      updated_at: res.updated_at,
      raw: res.raw,
    }
  }

  async cancelShipment(
    input: CancelCourierShipmentInput
  ): Promise<CancelCourierShipmentResult> {
    const res = await this.client_.cancelShipment(
      input.data as any,
      input.consignment_id
    )
    return { status: CourierShipmentStatus.CANCELED, raw: res.raw }
  }

  async getWebhookActionAndData(
    input: CourierWebhookInput
  ): Promise<CourierWebhookResult> {
    const d = (input.data ?? {}) as Record<string, any>
    const nested = (d.data ?? {}) as Record<string, any>

    const consignmentId =
      d.consignment_id ?? nested.consignment_id ?? d.id ?? nested.id
    if (!consignmentId) {
      return { action: "not_supported" }
    }

    const rawStatus =
      d.order_status ??
      d.status ??
      d.event ??
      nested.order_status ??
      nested.status

    const status = mapPathaoStatus(rawStatus)
    if (!status) {
      return {
        action: "not_supported",
        consignment_id: String(consignmentId),
        raw: d,
      }
    }

    const orderId = d.merchant_order_id ?? nested.merchant_order_id
    const deliveryFee = d.delivery_fee ?? nested.delivery_fee

    return {
      action: "status.changed",
      consignment_id: String(consignmentId),
      order_id: orderId != null ? String(orderId) : undefined,
      status,
      delivery_fee:
        deliveryFee != null && Number.isFinite(Number(deliveryFee))
          ? Number(deliveryFee)
          : undefined,
      raw: d,
    }
  }
}

// re-export for tests
export { mapPathaoStatus }
