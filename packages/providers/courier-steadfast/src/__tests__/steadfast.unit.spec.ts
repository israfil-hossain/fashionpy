import { CourierDeliveryType, CourierShipmentStatus } from "@mercurjs/types"

import { SteadfastClient } from "../client"
import { SteadfastCourierProvider } from "../services/steadfast"
import {
  SteadfastApiError,
  mapSteadfastStatus,
  normalizeBdPhone,
} from "../types"

const CREDS = { apiKey: "key-1", secretKey: "secret-1" }

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

const mockFetch = (
  handlers: Record<string, () => Response | Promise<Response>>
) => {
  const calls: { url: string; method: string; headers: any; body?: any }[] = []
  const fetchMock = (async (input: any, init?: any) => {
    const url = String(input)
    const method = init?.method ?? "GET"
    const body = init?.body ? JSON.parse(init.body) : undefined
    calls.push({ url, method, headers: init?.headers ?? {}, body })

    for (const [key, handler] of Object.entries(handlers)) {
      const [m, path] = key.split(" ")
      if (method === m && url.includes(path)) {
        return handler()
      }
    }
    return jsonResponse({ status: "error", message: `no mock for ${method} ${url}` }, 404)
  }) as typeof fetch

  return { fetchMock, calls }
}

describe("mapSteadfastStatus", () => {
  it.each([
    ["in_review", CourierShipmentStatus.PENDING],
    ["rider_assigned", CourierShipmentStatus.PICKED_UP],
    ["in_transit", CourierShipmentStatus.IN_TRANSIT],
    ["on_hold", CourierShipmentStatus.IN_TRANSIT],
    ["at_hub", CourierShipmentStatus.IN_TRANSIT],
    ["out_for_delivery", CourierShipmentStatus.OUT_FOR_DELIVERY],
    ["delivered_approval_pending", CourierShipmentStatus.OUT_FOR_DELIVERY],
    ["partial_delivered", CourierShipmentStatus.OUT_FOR_DELIVERY],
    ["delivered", CourierShipmentStatus.DELIVERED],
    ["cancelled", CourierShipmentStatus.CANCELED],
    // return states must win over the "cancel" substring
    ["cancelled_return_processing", CourierShipmentStatus.RETURNED],
    ["return_received", CourierShipmentStatus.RETURNED],
  ])("maps %j → %s", (raw, expected) => {
    expect(mapSteadfastStatus(raw)).toEqual(expected)
  })

  it("returns undefined for unknown statuses", () => {
    expect(mapSteadfastStatus("teleported")).toBeUndefined()
    expect(mapSteadfastStatus(null)).toBeUndefined()
  })
})

describe("normalizeBdPhone", () => {
  it.each([
    ["01712345678", "01712345678"],
    ["8801712345678", "01712345678"],
    ["+880 1712 345678", "01712345678"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeBdPhone(input)).toEqual(expected)
  })
})

describe("SteadfastClient.createShipment", () => {
  it("books a consignment and maps the bare response", async () => {
    const { fetchMock, calls } = mockFetch({
      "POST /create_order": () =>
        jsonResponse({
          consignment_id: 1424107,
          invoice: "ord_abc",
          tracking_code: "15BAEB8A",
          tracking_link: "https://steadfast.com.bd/t/a1b2c3d4",
          status: "in_review",
          cod_amount: 1060,
        }),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const client = new SteadfastClient()
      const result = await client.createShipment(CREDS, {
        data: CREDS,
        order_id: "ord_abc",
        fulfillment_id: "ful_1",
        recipient: {
          name: "Jahid Hasan",
          phone: "+880 1712-345678",
          address: "House 17/1, Road 3/A, Dhanmondi, Dhaka-1209",
          email: "buyer@example.com",
        },
        weight: 1,
        item_count: 3,
        item_description: "Winter hoodie",
        special_instruction: "Handle with care",
        cod_amount: 1060,
        currency_code: "BDT",
        delivery_type: CourierDeliveryType.POINT,
      })

      expect(result).toMatchObject({
        consignment_id: "1424107",
        tracking_code: "15BAEB8A",
        tracking_url: "https://steadfast.com.bd/t/a1b2c3d4",
        status: CourierShipmentStatus.PENDING,
      })

      const call = calls.find((c) => c.url.includes("/create_order"))
      expect(call?.headers["Api-Key"]).toBe("key-1")
      expect(call?.headers["Secret-Key"]).toBe("secret-1")
      expect(call?.body).toMatchObject({
        invoice: "ord_abc",
        recipient_phone: "01712345678",
        cod_amount: 1060,
        total_lot: 3,
        delivery_type: 1, // POINT → hub pickup
        item_description: "Winter hoodie",
        note: "Handle with care",
      })
      // no secondary phone entered → the optional key must be omitted entirely
      expect(call?.body).not.toHaveProperty("alternative_phone")
      expect(call?.body.item_description).toBe("Winter hoodie")
    } finally {
      global.fetch = originalFetch
    }
  })

  it("unwraps {status, data} responses and builds the tracking fallback URL", async () => {
    const { fetchMock } = mockFetch({
      "POST /create_order": () =>
        jsonResponse({
          status: "success",
          data: {
            consignment_id: 555,
            invoice: "ord_x",
            tracking_code: "AB12CD34",
            status: "in_review",
          },
        }),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const client = new SteadfastClient()
      const result = await client.createShipment(CREDS, {
        data: CREDS,
        order_id: "ord_x",
        fulfillment_id: "f",
        recipient: { name: "A", phone: "01711111111", address: "X" },
        weight: 1,
        item_count: 1,
        cod_amount: 0,
        currency_code: "BDT",
      })

      expect(result.consignment_id).toBe("555")
      expect(result.tracking_url).toBe(
        "https://steadfast.com.bd/track/consignment/AB12CD34"
      )
      expect(result.status).toEqual(CourierShipmentStatus.PENDING)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("surfaces Steadfast error messages", async () => {
    const { fetchMock } = mockFetch({
      "POST /create_order": () =>
        jsonResponse({ message: "Invalid invoice" }, 422),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const client = new SteadfastClient()
      await expect(
        client.createShipment(CREDS, {
          data: CREDS,
          order_id: "ord",
          fulfillment_id: "f",
          recipient: { name: "A", phone: "01711111111", address: "X" },
          weight: 1,
          item_count: 1,
          cod_amount: 0,
          currency_code: "BDT",
        })
      ).rejects.toMatchObject({
        name: "SteadfastApiError",
        message: "Invalid invoice",
      })
    } finally {
      global.fetch = originalFetch
    }
  })
})

describe("SteadfastCourierProvider", () => {
  const WEBHOOK_OPTS = { webhookToken: "tok-abc" }

  it("validateAccount round-trips get_balance", async () => {
    const { fetchMock } = mockFetch({
      "GET /get_balance": () =>
        jsonResponse({ status: "success", data: { current_balance: 4200 } }),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const provider = new SteadfastCourierProvider({}, WEBHOOK_OPTS)
      const result = await provider.validateAccount({ data: CREDS })
      expect(result.valid).toBe(true)
      expect((result.data as any).balance).toBeDefined()
    } finally {
      global.fetch = originalFetch
    }
  })

  it("validateAccount marks 401 invalid, rethrows network errors", async () => {
    const { fetchMock } = mockFetch({
      "GET /get_balance": () => jsonResponse({ message: "Unauthenticated" }, 401),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const provider = new SteadfastCourierProvider({}, WEBHOOK_OPTS)
      const result = await provider.validateAccount({ data: CREDS })
      expect(result.valid).toBe(false)
    } finally {
      global.fetch = originalFetch
    }

    global.fetch = (async () => {
      throw new TypeError("fetch failed")
    }) as typeof fetch
    try {
      const provider = new SteadfastCourierProvider({}, WEBHOOK_OPTS)
      await expect(
        provider.validateAccount({ data: CREDS })
      ).rejects.toBeInstanceOf(SteadfastApiError)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("getRates always returns null (no Steadfast rate API)", async () => {
    const provider = new SteadfastCourierProvider({}, WEBHOOK_OPTS)
    const quote = await provider.getRates({
      data: CREDS,
      recipient: { name: "A", phone: "017", address: "X" },
      weight: 1,
    })
    expect(quote).toBeNull()
  })

  it("rejects webhooks without a configured token or wrong bearer", async () => {
    const unconfigured = new SteadfastCourierProvider({}, {})
    await expect(
      unconfigured.getWebhookActionAndData({
        data: {},
        rawData: "",
        headers: {},
      })
    ).rejects.toThrow(/not configured/)

    const provider = new SteadfastCourierProvider({}, WEBHOOK_OPTS)
    await expect(
      provider.getWebhookActionAndData({
        data: { consignment_id: 1 },
        rawData: "",
        headers: { authorization: "Bearer wrong" },
      })
    ).rejects.toThrow(/bearer/)
  })

  it("accepts a valid delivery_status webhook and maps status", async () => {
    const provider = new SteadfastCourierProvider({}, WEBHOOK_OPTS)
    const result = await provider.getWebhookActionAndData({
      data: {
        notification_type: "delivery_status",
        consignment_id: 1424107,
        invoice: "ord_abc",
        status: "delivered",
        cod_amount: 1060,
      },
      rawData: "{}",
      headers: { authorization: "Bearer tok-abc" },
    })

    expect(result).toMatchObject({
      action: "status.changed",
      consignment_id: "1424107",
      order_id: "ord_abc",
      status: CourierShipmentStatus.DELIVERED,
    })
  })

  it("verifies HMAC signatures when present", async () => {
    const { createHmac } = require("node:crypto")
    const provider = new SteadfastCourierProvider({}, WEBHOOK_OPTS)

    const raw = JSON.stringify({
      notification_type: "delivery_status",
      consignment_id: 9,
      status: "in_transit",
    })
    const goodSig = createHmac("sha256", "tok-abc").update(raw).digest("hex")

    const ok = await provider.getWebhookActionAndData({
      data: JSON.parse(raw),
      rawData: raw,
      headers: {
        authorization: "Bearer tok-abc",
        "x-signature": goodSig,
      },
    })
    expect(ok.status).toEqual(CourierShipmentStatus.IN_TRANSIT)

    await expect(
      provider.getWebhookActionAndData({
        data: JSON.parse(raw),
        rawData: raw,
        headers: {
          authorization: "Bearer tok-abc",
          "x-signature": "deadbeef".repeat(8),
        },
      })
    ).rejects.toThrow(/signature/)
  })

  it("acknowledges non-delivery events as not_supported", async () => {
    const provider = new SteadfastCourierProvider({}, WEBHOOK_OPTS)
    const result = await provider.getWebhookActionAndData({
      data: {
        notification_type: "tracking_update",
        consignment_id: 1,
        tracking_message: "Scanned at hub",
      },
      rawData: "{}",
      headers: { authorization: "Bearer tok-abc" },
    })
    expect(result.action).toBe("not_supported")
  })
})
