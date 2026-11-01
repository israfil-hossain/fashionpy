import crypto from "crypto"

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

/**
 * Dev/test fallback. Books nothing real: returns a synthetic consignment so
 * the fulfillment flow (labels, status, delivered hook) can be exercised
 * without courier credentials.
 */
export class SystemCourierProvider implements ICourierProvider {
  static identifier = "system"

  async validateAccount(
    _input: ValidateCourierAccountInput
  ): Promise<ValidateCourierAccountResponse> {
    return { valid: true, data: {} }
  }

  async getRates(
    _input: CourierRateRequest & { data: Record<string, unknown> }
  ): Promise<CourierRateQuote | null> {
    return null
  }

  async createShipment(
    input: CreateCourierShipmentInput
  ): Promise<CreateCourierShipmentResult> {
    return {
      consignment_id: `sys_${crypto.randomUUID()}`,
      tracking_code: `SYS${crypto.randomInt(100000, 999999)}`,
      tracking_url: null,
      status: CourierShipmentStatus.PENDING,
      delivery_fee: 0,
      raw: { simulated: true, order_id: input.order_id },
    }
  }

  async getShipmentStatus(
    _input: GetCourierShipmentStatusInput
  ): Promise<GetCourierShipmentStatusResult> {
    return { status: CourierShipmentStatus.PENDING }
  }

  async cancelShipment(
    _input: CancelCourierShipmentInput
  ): Promise<CancelCourierShipmentResult> {
    return { status: CourierShipmentStatus.CANCELED }
  }

  async getWebhookActionAndData(
    _input: CourierWebhookInput
  ): Promise<CourierWebhookResult> {
    return { action: "not_supported" }
  }
}
