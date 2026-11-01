import {
  PATHAO_BASE_URLS,
  PATHAO_DELIVERY_TYPE,
  PATHAO_ITEM_TYPE,
  PathaoApiError,
  PathaoCredentials,
  PathaoProviderOptions,
  mapPathaoStatus,
  normalizeBdPhone,
} from "./types"
import { CourierDeliveryType, CourierShipmentStatus } from "@mercurjs/types"
import type {
  CourierRateQuote,
  CourierRateRequest,
  CreateCourierShipmentInput,
  CreateCourierShipmentResult,
} from "@mercurjs/types"

type Json = Record<string, any>

const REQUEST_TIMEOUT_MS = 15_000

/**
 * Minimal Pathao Merchant API client (OAuth2 password grant, /aladdin/api/v1).
 * Uses global fetch — no SDK dependency.
 */
export class PathaoClient {
  protected readonly baseUrl: string
  protected readonly options: PathaoProviderOptions

  constructor(options: PathaoProviderOptions = {}) {
    this.options = options
    this.baseUrl = (
      options.baseUrl ??
      (options.sandbox ? PATHAO_BASE_URLS.sandbox : PATHAO_BASE_URLS.live)
    ).replace(/\/$/, "")
  }

  protected requireCredentials(data: Record<string, unknown>): PathaoCredentials {
    const creds = data as Partial<PathaoCredentials>
    if (!creds.client_id || !creds.client_secret || !creds.username || !creds.password) {
      throw new PathaoApiError(
        "Pathao credentials are incomplete — client_id, client_secret, username and password are required."
      )
    }
    return creds as PathaoCredentials
  }

  protected async request<T = Json>(
    method: "GET" | "POST",
    path: string,
    body?: Json,
    accessToken?: string
  ): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (error: any) {
      throw new PathaoApiError(
        `Pathao request failed: ${error?.message ?? error}`,
        { status: 0 }
      )
    }

    let payload: Json = {}
    try {
      payload = (await response.json()) as Json
    } catch {
      // Non-JSON error body — fall through with status only
    }

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error_description ||
        `Pathao responded with HTTP ${response.status}`
      throw new PathaoApiError(message, {
        status: response.status,
        code: payload?.code,
        body: payload,
      })
    }

    return payload as T
  }

  async issueToken(creds: PathaoCredentials): Promise<string> {
    const res = await this.request<{
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }>("POST", "/aladdin/api/v1/issue-token", {
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      username: creds.username,
      password: creds.password,
      grant_type: "password",
    })

    if (!res.access_token) {
      throw new PathaoApiError("Pathao did not return an access token.", {
        body: res,
      })
    }
    return res.access_token
  }

  /**
   * Validate credentials and list the merchant's stores (store_id is required
   * at booking; the list lets the seller pick one and enables the default-store
   * fallback at createShipment time).
   */
  async validate(creds: PathaoCredentials): Promise<{ stores: Json[] }> {
    const token = await this.issueToken(creds)
    const res = await this.request<Json>(
      "GET",
      "/aladdin/api/v1/stores",
      undefined,
      token
    )
    // Response: { data: { data: [...stores], ...pagination } }
    const stores: Json[] = res?.data?.data ?? res?.data ?? []
    return { stores: Array.isArray(stores) ? stores : [] }
  }

  protected async ensureStoreId(
    token: string,
    creds: PathaoCredentials
  ): Promise<number> {
    if (creds.store_id) return creds.store_id

    const res = await this.request<Json>(
      "GET",
      "/aladdin/api/v1/stores",
      undefined,
      token
    )
    const stores: Json[] = res?.data?.data ?? []
    if (!stores.length) {
      throw new PathaoApiError(
        "No Pathao stores found for this account — create a store in the Pathao merchant panel first."
      )
    }
    const preferred =
      stores.find((s) => s.is_default_store) ?? stores[0]
    return Number(preferred.store_id)
  }

  async createShipment(
    creds: PathaoCredentials,
    input: CreateCourierShipmentInput
  ): Promise<CreateCourierShipmentResult> {
    const token = await this.issueToken(creds)
    const storeId = await this.ensureStoreId(token, creds)

    const weight = Math.min(10, Math.max(0.5, input.weight || 0.5))
    const deliveryType =
      PATHAO_DELIVERY_TYPE[input.delivery_type ?? CourierDeliveryType.NORMAL] ??
      48

    // recipient_city/zone/area intentionally omitted — Pathao auto-detects the
    // delivery area from a complete address (July 2025+ API behavior).
    const res = await this.request<Json>(
      "POST",
      "/aladdin/api/v1/orders",
      {
        store_id: storeId,
        merchant_order_id: input.order_id,
        recipient_name: input.recipient.name,
        recipient_phone: normalizeBdPhone(input.recipient.phone),
        ...(input.recipient.secondary_phone
          ? {
              recipient_secondary_phone: normalizeBdPhone(
                input.recipient.secondary_phone
              ),
            }
          : {}),
        recipient_address: input.recipient.address,
        delivery_type: deliveryType,
        item_type: PATHAO_ITEM_TYPE.PARCEL,
        item_quantity: Math.max(1, input.item_count || 1),
        item_weight: weight,
        amount_to_collect: Math.max(0, Math.round(input.cod_amount || 0)),
        ...(input.item_description
          ? { item_description: input.item_description }
          : {}),
        ...(input.special_instruction
          ? { special_instruction: input.special_instruction }
          : {}),
      },
      token
    )

    const data = res?.data ?? res
    const consignmentId = data?.consignment_id
    if (!consignmentId) {
      throw new PathaoApiError("Pathao did not return a consignment id.", {
        body: res,
      })
    }

    const phone = normalizeBdPhone(input.recipient.phone)
    return {
      consignment_id: String(consignmentId),
      tracking_code: String(consignmentId),
      tracking_url: `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}&phone=${phone}`,
      status:
        mapPathaoStatus(data?.order_status) ?? CourierShipmentStatus.PENDING,
      delivery_fee: Number(data?.delivery_fee ?? 0) || undefined,
      raw: res as Record<string, unknown>,
    }
  }

  /**
   * Price-plan quote. Returns null when the destination city can't be mapped
   * to a Pathao city — callers fall back to the seller's flat rate.
   */
  async getRates(
    creds: PathaoCredentials,
    request: CourierRateRequest
  ): Promise<CourierRateQuote | null> {
    const token = await this.issueToken(creds)
    const storeId = await this.ensureStoreId(token, creds)

    const cityId = await this.resolveCityId(token, request.recipient.city)
    if (!cityId) return null

    const zoneId = await this.resolveZoneId(token, cityId)
    if (!zoneId) return null

    const weight = Math.min(10, Math.max(0.5, request.weight || 0.5))
    const deliveryType =
      PATHAO_DELIVERY_TYPE[
        (request as { delivery_type?: CourierDeliveryType }).delivery_type ??
          CourierDeliveryType.NORMAL
      ] ?? 48

    const res = await this.request<Json>(
      "POST",
      "/aladdin/api/v1/merchant/price-plan",
      {
        store_id: storeId,
        item_type: PATHAO_ITEM_TYPE.PARCEL,
        item_weight: weight,
        delivery_type: deliveryType,
        recipient_city: cityId,
        recipient_zone: zoneId,
      },
      token
    )

    const data = res?.data ?? res
    const price = Number(data?.final_price ?? data?.price)
    if (!Number.isFinite(price)) return null

    return {
      price,
      currency_code: "BDT",
      eta_description: "Pathao live quote",
      raw: res as Record<string, unknown>,
    }
  }

  async getStatus(
    creds: PathaoCredentials,
    consignmentId: string
  ): Promise<{ status?: CourierShipmentStatus; updated_at?: string; raw: Json }> {
    const token = await this.issueToken(creds)
    const res = await this.request<Json>(
      "GET",
      `/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`,
      undefined,
      token
    )
    const data = res?.data ?? res
    return {
      status: mapPathaoStatus(data?.order_status ?? data?.status),
      updated_at: data?.updated_at,
      raw: res,
    }
  }

  async cancelShipment(
    creds: PathaoCredentials,
    consignmentId: string
  ): Promise<{ raw: Json }> {
    const token = await this.issueToken(creds)
    const res = await this.request<Json>(
      "POST",
      `/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/cancel`,
      {},
      token
    )
    return { raw: res }
  }

  protected async resolveCityId(
    token: string,
    cityName?: string
  ): Promise<number | null> {
    if (!cityName) return null
    const res = await this.request<Json>(
      "GET",
      "/aladdin/api/v1/city-list",
      undefined,
      token
    )
    const cities: Json[] = res?.data?.data ?? []
    const needle = cityName.trim().toLowerCase()
    const match = cities.find(
      (c) => String(c.city_name ?? "").trim().toLowerCase() === needle
    )
    if (!match) return null
    return Number(match.city_id)
  }

  protected async resolveZoneId(
    token: string,
    cityId: number
  ): Promise<number | null> {
    const res = await this.request<Json>(
      "GET",
      `/aladdin/api/v1/cities/${cityId}/zone-list`,
      undefined,
      token
    )
    const zones: Json[] = res?.data?.data ?? []
    if (!zones.length) return null
    return Number(zones[0].zone_id)
  }
}
