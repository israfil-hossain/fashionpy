import { createHmac, timingSafeEqual } from "node:crypto"

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

import { SteadfastClient } from "../client"
import {
  SteadfastApiError,
  SteadfastProviderOptions,
  mapSteadfastStatus,
} from "../types"

export class SteadfastCourierProvider implements ICourierProvider {
  static identifier = "steadfast"
  static LIFE_TIME = "SCOPED"

  protected readonly client_: SteadfastClient
  protected readonly webhookToken_?: string

  constructor(_cradle: unknown, options: SteadfastProviderOptions = {}) {
    this.client_ = new SteadfastClient(options)
    this.webhookToken_ = options.webhookToken
  }

  async validateAccount(
    input: ValidateCourierAccountInput
  ): Promise<ValidateCourierAccountResponse> {
    try {
      const balance = await this.client_.validate(input.data as any)
      return { valid: true, data: { balance } }
    } catch (error) {
      if (error instanceof SteadfastApiError) {
        if (error.status === 0) throw error // network/timeout — not a credential verdict
        if (error.status && error.status >= 500) throw error
        return { valid: false, message: error.message }
      }
      throw error
    }
  }

  /**
   * Steadfast exposes no rate API — always fall back to the flat price.
   */
  async getRates(
    _input: CourierRateRequest & { data: Record<string, unknown> }
  ): Promise<CourierRateQuote | null> {
    return null
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

  /**
   * Steadfast has no public cancel endpoint — parcels are cancelled from the
   * merchant panel. Keep the optional method absent (interface allows it).
   */
  async cancelShipment(
    _input: CancelCourierShipmentInput
  ): Promise<CancelCourierShipmentResult> {
    throw new SteadfastApiError(
      "Steadfast consignments cannot be cancelled via the API — cancel in the Steadfast merchant panel."
    )
  }

  async getWebhookActionAndData(
    input: CourierWebhookInput
  ): Promise<CourierWebhookResult> {
    const token = this.webhookToken_
    if (!token) {
      throw new SteadfastApiError(
        "Steadfast webhook rejected: webhook token is not configured (set STEADFAST_WEBHOOK_TOKEN).",
        { status: 401 }
      )
    }

    this.verifyAuth_(input, token)

    const d = (input.data ?? {}) as Record<string, any>
    const notificationType = d.notification_type ?? "delivery_status"

    // Only delivery status events change shipment state; everything else
    // (tracking_update, pickup_request, ...) is acknowledged but not acted on.
    if (notificationType !== "delivery_status") {
      return { action: "not_supported", raw: d }
    }

    if (d.consignment_id == null) {
      return { action: "not_supported", raw: d }
    }

    const status = mapSteadfastStatus(d.status)
    if (!status) {
      return {
        action: "not_supported",
        consignment_id: String(d.consignment_id),
        raw: d,
      }
    }

    const deliveryCharge = d.delivery_charge ?? d.cod_amount
    return {
      action: "status.changed",
      consignment_id: String(d.consignment_id),
      // We book with invoice = Mercur order id
      order_id: d.invoice != null ? String(d.invoice) : undefined,
      status,
      delivery_fee:
        deliveryCharge != null && Number.isFinite(Number(deliveryCharge))
          ? Number(deliveryCharge)
          : undefined,
      raw: d,
    }
  }

  protected verifyAuth_(input: CourierWebhookInput, token: string): void {
    const headers = input.headers ?? {}
    const auth =
      headers["authorization"] ?? headers["Authorization"] ?? ""
    if (auth !== `Bearer ${token}`) {
      throw new SteadfastApiError(
        "Steadfast webhook rejected: invalid bearer token.",
        { status: 401 }
      )
    }

    // Signature is verified only when the courier sends one — Steadfast's
    // HMAC recipe is keyed with the same bearer token.
    const signature =
      headers["x-signature"] ??
      headers["X-Signature"] ??
      headers["x-Signature"]
    if (signature) {
      const expected = createHmac("sha256", token)
        .update(
          typeof input.rawData === "string"
            ? input.rawData
            : input.rawData.toString("utf8")
        )
        .digest("hex")
      const a = Buffer.from(expected, "hex")
      const b = Buffer.from(String(signature), "hex")
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new SteadfastApiError(
          "Steadfast webhook rejected: signature mismatch.",
          { status: 401 }
        )
      }
    }
  }
}

// re-export for tests
export { mapSteadfastStatus }
