import type {
  CourierShipmentStatus,
  CreateCourierShipmentInput,
  CreateCourierShipmentResult,
} from "@mercurjs/types"
import { CourierDeliveryType, CourierShipmentStatus as Status } from "@mercurjs/types"

import {
  STEADFAST_DEFAULT_BASE_URL,
  STEADFAST_DELIVERY_TYPE,
  SteadfastApiError,
  SteadfastCredentials,
  SteadfastProviderOptions,
  mapSteadfastStatus,
  normalizeBdPhone,
} from "./types"

type Json = Record<string, any>

const REQUEST_TIMEOUT_MS = 15_000

/**
 * Minimal Steadfast (Packzy) merchant API client — header auth
 * (Api-Key / Secret-Key), no SDK dependency.
 */
export class SteadfastClient {
  protected readonly baseUrl: string
  protected readonly options: SteadfastProviderOptions

  constructor(options: SteadfastProviderOptions = {}) {
    this.options = options
    this.baseUrl = (
      options.baseUrl ?? STEADFAST_DEFAULT_BASE_URL
    ).replace(/\/$/, "")
  }

  protected requireCredentials(
    data: Record<string, unknown>
  ): SteadfastCredentials {
    const creds = data as Partial<SteadfastCredentials>
    if (!creds.apiKey || !creds.secretKey) {
      throw new SteadfastApiError(
        "Steadfast credentials are incomplete — apiKey and secretKey are required."
      )
    }
    return creds as SteadfastCredentials
  }

  protected async request<T = Json>(
    method: "GET" | "POST",
    path: string,
    creds: SteadfastCredentials,
    body?: Json
  ): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Api-Key": creds.apiKey,
          "Secret-Key": creds.secretKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (error: any) {
      throw new SteadfastApiError(
        `Steadfast request failed: ${error?.message ?? error}`,
        { status: 0 }
      )
    }

    let payload: Json = {}
    try {
      payload = (await response.json()) as Json
    } catch {
      // Non-JSON body — fall through with status only
    }

    if (!response.ok) {
      const message =
        (typeof payload?.message === "string" && payload.message) ||
        (typeof payload?.error === "string" && payload.error) ||
        `Steadfast responded with HTTP ${response.status}`
      throw new SteadfastApiError(message, {
        status: response.status,
        body: payload,
      })
    }

    return payload as T
  }

  /**
   * Credential round-trip — get_balance doubles as the auth check.
   */
  async validate(creds: SteadfastCredentials): Promise<Record<string, unknown>> {
    const res = await this.request<Json>("GET", "/get_balance", creds)
    return { balance: res?.data ?? res }
  }

  async createShipment(
    creds: SteadfastCredentials,
    input: CreateCourierShipmentInput
  ): Promise<CreateCourierShipmentResult> {
    const deliveryType =
      STEADFAST_DELIVERY_TYPE[
        input.delivery_type ?? CourierDeliveryType.NORMAL
      ] ?? 0

    const res = await this.request<Json>("POST", "/create_order", creds, {
      invoice: input.order_id.slice(0, 100),
      recipient_name: input.recipient.name,
      recipient_phone: normalizeBdPhone(input.recipient.phone),
      recipient_address: input.recipient.address,
      ...(input.recipient.secondary_phone
        ? { alternative_phone: normalizeBdPhone(input.recipient.secondary_phone) }
        : {}),
      ...(input.recipient.email ? { recipient_email: input.recipient.email } : {}),
      cod_amount: Math.max(0, Math.round(input.cod_amount || 0)),
      total_lot: Math.max(1, input.item_count || 1),
      delivery_type: deliveryType,
      ...(input.item_description
        ? { item_description: input.item_description.slice(0, 255) }
        : {}),
      ...(input.special_instruction
        ? { note: input.special_instruction.slice(0, 480) }
        : {}),
    })

    // Response arrives bare or wrapped in { status, data }
    const c: Json = res?.consignment_id != null ? res : (res?.data ?? {})
    if (c.consignment_id == null) {
      throw new SteadfastApiError(
        "Steadfast did not return a consignment id.",
        { body: res }
      )
    }

    const trackingCode =
      c.tracking_code != null ? String(c.tracking_code) : undefined

    return {
      consignment_id: String(c.consignment_id),
      tracking_code: trackingCode,
      tracking_url:
        (typeof c.tracking_link === "string" && c.tracking_link) ||
        (trackingCode
          ? `https://steadfast.com.bd/track/consignment/${trackingCode}`
          : undefined),
      status: mapSteadfastStatus(c.status) ?? Status.PENDING,
      delivery_fee:
        c.delivery_charge != null && Number.isFinite(Number(c.delivery_charge))
          ? Number(c.delivery_charge)
          : undefined,
      raw: res as Record<string, unknown>,
    }
  }

  async getStatus(
    creds: SteadfastCredentials,
    consignmentId: string
  ): Promise<{
    status?: CourierShipmentStatus
    updated_at?: string
    raw: Json
  }> {
    const res = await this.request<Json>(
      "GET",
      `/status_by_cid/${encodeURIComponent(consignmentId)}`,
      creds
    )
    const data: Json = res?.data ?? res
    const raw =
      data.delivery_status ?? data.status ?? res.delivery_status ?? res.status
    return {
      status: mapSteadfastStatus(raw),
      updated_at: data.updated_at ?? res.updated_at,
      raw: res,
    }
  }
}
