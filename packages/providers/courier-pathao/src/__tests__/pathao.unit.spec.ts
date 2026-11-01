import { CourierDeliveryType, CourierShipmentStatus } from "@mercurjs/types"

import { PathaoClient } from "../client"
import { PathaoCourierProvider } from "../services/pathao"
import {
  PathaoApiError,
  mapPathaoStatus,
  normalizeBdPhone,
} from "../types"

const CREDS = {
  client_id: "cid",
  client_secret: "sec",
  username: "user@shop.com",
  password: "pw",
  store_id: 7,
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

/**
 * Route-aware fetch mock: handlers keyed by "METHOD /path" (path prefix).
 * Falls through to a failing response so unexpected calls are loud.
 */
const mockFetch = (
  handlers: Record<string, () => Response | Promise<Response>>
) => {
  const calls: { url: string; method: string; body?: any }[] = []
  const fetchMock = (async (input: any, init?: any) => {
    const url = String(input)
    const method = init?.method ?? "GET"
    const body = init?.body ? JSON.parse(init.body) : undefined
    calls.push({ url, method, body })

    for (const [key, handler] of Object.entries(handlers)) {
      const [m, path] = key.split(" ")
      if (method === m && url.includes(path)) {
        return handler()
      }
    }
    return jsonResponse({ type: "error", code: 404, message: `no mock for ${method} ${url}` }, 404)
  }) as typeof fetch

  return { fetchMock, calls }
}

describe("mapPathaoStatus", () => {
  it.each([
    ["delivered", CourierShipmentStatus.DELIVERED],
    ["Delivered", CourierShipmentStatus.DELIVERED],
    ["returning", CourierShipmentStatus.RETURNED],
    ["return_received", CourierShipmentStatus.RETURNED],
    ["cancelled", CourierShipmentStatus.CANCELED],
    ["canceled by merchant", CourierShipmentStatus.CANCELED],
    ["out_for_delivery", CourierShipmentStatus.OUT_FOR_DELIVERY],
    ["in_transit", CourierShipmentStatus.IN_TRANSIT],
    ["hub_received", CourierShipmentStatus.IN_TRANSIT],
    ["delivery_requested", CourierShipmentStatus.IN_TRANSIT],
    ["picked", CourierShipmentStatus.PICKED_UP],
    ["picked_up", CourierShipmentStatus.PICKED_UP],
    ["created", CourierShipmentStatus.PENDING],
    ["pending", CourierShipmentStatus.PENDING],
    ["in_review", CourierShipmentStatus.PENDING],
  ])("maps %j → %s", (raw, expected) => {
    expect(mapPathaoStatus(raw)).toEqual(expected)
  })

  it("returns undefined for unknown statuses", () => {
    expect(mapPathaoStatus("mystery_state")).toBeUndefined()
    expect(mapPathaoStatus(null)).toBeUndefined()
    expect(mapPathaoStatus(undefined)).toBeUndefined()
  })
})

describe("normalizeBdPhone", () => {
  it.each([
    ["01712345678", "01712345678"],
    ["8801712345678", "01712345678"],
    ["+880 1712-345678", "01712345678"],
    ["01712-345678", "01712345678"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeBdPhone(input)).toEqual(expected)
  })
})

describe("PathaoClient.createShipment", () => {
  it("books a consignment with normalized payload and maps the result", async () => {
    const { fetchMock, calls } = mockFetch({
      "POST /aladdin/api/v1/issue-token": () =>
        jsonResponse({ token_type: "bearer", expires_in: 7200, access_token: "tok-1" }),
      "POST /aladdin/api/v1/orders": () =>
        jsonResponse({
          type: "success",
          code: 200,
          message: "ok",
          data: {
            consignment_id: "PTH000111",
            merchant_order_id: "ord_123",
            order_status: "created",
            delivery_fee: 120,
          },
        }),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const client = new PathaoClient({ sandbox: true })
      const result = await client.createShipment(CREDS, {
        data: CREDS,
        order_id: "ord_123",
        fulfillment_id: "ful_1",
        recipient: {
          name: "Rafi Ahmed",
          phone: "+880 1712-345678",
          address: "House 1, Road 2, Dhanmondi, Dhaka",
        },
        weight: 0.2, // below Pathao minimum → clamped to 0.5
        item_count: 2,
        cod_amount: 1500,
        currency_code: "BDT",
        delivery_type: CourierDeliveryType.ON_DEMAND,
      })

      expect(result.consignment_id).toBe("PTH000111")
      expect(result.status).toEqual(CourierShipmentStatus.PENDING)
      expect(result.delivery_fee).toBe(120)
      expect(result.tracking_url).toContain("consignment_id=PTH000111")
      expect(result.tracking_url).toContain("phone=01712345678")

      const orderCall = calls.find((c) => c.url.includes("/orders") && c.method === "POST")
      expect(orderCall?.body).toMatchObject({
        store_id: 7,
        merchant_order_id: "ord_123",
        recipient_phone: "01712345678",
        delivery_type: 12, // ON_DEMAND → 12
        item_type: 2,
        item_quantity: 2,
        item_weight: 0.5, // clamped up from 0.2
        amount_to_collect: 1500,
      })
      // auto-area detection: city/zone/area must be omitted
      expect(orderCall?.body.recipient_city).toBeUndefined()
      expect(orderCall?.body.recipient_zone).toBeUndefined()
    } finally {
      global.fetch = originalFetch
    }
  })

  it("resolves the default store when store_id is not configured", async () => {
    const { fetchMock, calls } = mockFetch({
      "POST /aladdin/api/v1/issue-token": () =>
        jsonResponse({ access_token: "tok" }),
      "GET /aladdin/api/v1/stores": () =>
        jsonResponse({
          data: {
            data: [
              { store_id: 3, store_name: "Other", is_default_store: false },
              { store_id: 9, store_name: "Main", is_default_store: true },
            ],
          },
        }),
      "POST /aladdin/api/v1/orders": () =>
        jsonResponse({ data: { consignment_id: "PTH2", order_status: "created" } }),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const client = new PathaoClient({ baseUrl: "https://sandbox.test" })
      const { store_id, ...creds } = CREDS
      void store_id
      await client.createShipment(creds as any, {
        data: creds,
        order_id: "ord_1",
        fulfillment_id: "f1",
        recipient: { name: "A", phone: "01711111111", address: "Addr" },
        weight: 1,
        item_count: 1,
        cod_amount: 0,
        currency_code: "BDT",
      })

      const orderCall = calls.find((c) => c.url.includes("/orders") && c.method === "POST")
      expect(orderCall?.body.store_id).toBe(9)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("surfaces Pathao error messages", async () => {
    const { fetchMock } = mockFetch({
      "POST /aladdin/api/v1/issue-token": () =>
        jsonResponse({ type: "error", code: 401, message: "invalid client" }, 401),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const client = new PathaoClient({ sandbox: true })
      await expect(
        client.createShipment(CREDS, {
          data: CREDS,
          order_id: "o",
          fulfillment_id: "f",
          recipient: { name: "A", phone: "01711111111", address: "X" },
          weight: 1,
          item_count: 1,
          cod_amount: 0,
          currency_code: "BDT",
        })
      ).rejects.toMatchObject({ name: "PathaoApiError", message: "invalid client" })
    } finally {
      global.fetch = originalFetch
    }
  })
})

describe("PathaoClient.getRates", () => {
  const rateHandlers = {
    "POST /aladdin/api/v1/issue-token": () =>
      jsonResponse({ access_token: "tok" }),
    "GET /aladdin/api/v1/stores": () =>
      jsonResponse({ data: { data: [{ store_id: 7, is_default_store: true }] } }),
    "GET /aladdin/api/v1/city-list": () =>
      jsonResponse({ data: { data: [{ city_id: 10, city_name: "Dhaka" }] } }),
    "GET /zone-list": () =>
      jsonResponse({ data: { data: [{ zone_id: 5, zone_name: "Dhaka" }] } }),
    "POST /aladdin/api/v1/merchant/price-plan": () =>
      jsonResponse({
        data: { price: 160, discount: 10, final_price: 150, cod_enabled: 1 },
      }),
  }

  it("quotes a live price for a resolvable city", async () => {
    const { fetchMock, calls } = mockFetch(rateHandlers)
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const client = new PathaoClient({ sandbox: true })
      const quote = await client.getRates(CREDS, {
        recipient: { name: "A", phone: "01711111111", address: "X", city: "Dhaka" },
        weight: 2,
      })

      expect(quote).toMatchObject({ price: 150, currency_code: "BDT" })
      const priceCall = calls.find((c) => c.url.includes("price-plan"))
      expect(priceCall?.body).toMatchObject({
        store_id: 7,
        recipient_city: 10,
        recipient_zone: 5,
        item_weight: 2,
      })
    } finally {
      global.fetch = originalFetch
    }
  })

  it("returns null when the city cannot be resolved (flat-rate fallback)", async () => {
    const { fetchMock, calls } = mockFetch(rateHandlers)
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const client = new PathaoClient({ sandbox: true })
      const quote = await client.getRates(CREDS, {
        recipient: {
          name: "A",
          phone: "01711111111",
          address: "X",
          city: "Nowhereville",
        },
        weight: 1,
      })

      expect(quote).toBeNull()
      expect(calls.find((c) => c.url.includes("price-plan"))).toBeUndefined()
    } finally {
      global.fetch = originalFetch
    }
  })
})

describe("PathaoCourierProvider", () => {
  it("validateAccount returns stores on success", async () => {
    const { fetchMock } = mockFetch({
      "POST /aladdin/api/v1/issue-token": () =>
        jsonResponse({ access_token: "tok" }),
      "GET /aladdin/api/v1/stores": () =>
        jsonResponse({ data: { data: [{ store_id: 1, store_name: "Main" }] } }),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const provider = new PathaoCourierProvider({}, { sandbox: true })
      const result = await provider.validateAccount({ data: CREDS })
      expect(result.valid).toBe(true)
      expect((result.data as any).stores).toHaveLength(1)
    } finally {
      global.fetch = originalFetch
    }
  })

  it("validateAccount marks bad credentials invalid (401) but rethrows network errors", async () => {
    const { fetchMock } = mockFetch({
      "POST /aladdin/api/v1/issue-token": () =>
        jsonResponse({ message: "unauthorized" }, 401),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const provider = new PathaoCourierProvider({}, { sandbox: true })
      const result = await provider.validateAccount({ data: CREDS })
      expect(result.valid).toBe(false)
      expect(result.message).toBe("unauthorized")
    } finally {
      global.fetch = originalFetch
    }

    global.fetch = (async () => {
      throw new TypeError("fetch failed")
    }) as typeof fetch
    try {
      const provider = new PathaoCourierProvider({}, { sandbox: true })
      await expect(provider.validateAccount({ data: CREDS })).rejects.toBeInstanceOf(
        PathaoApiError
      )
    } finally {
      global.fetch = originalFetch
    }
  })

  it("getRates never throws — returns null on API errors", async () => {
    const { fetchMock } = mockFetch({
      "POST /aladdin/api/v1/issue-token": () =>
        jsonResponse({ message: "boom" }, 500),
    })
    const originalFetch = global.fetch
    global.fetch = fetchMock

    try {
      const provider = new PathaoCourierProvider({}, { sandbox: true })
      const quote = await provider.getRates({
        data: CREDS,
        recipient: { name: "A", phone: "01711111111", address: "X", city: "Dhaka" },
        weight: 1,
      })
      expect(quote).toBeNull()
    } finally {
      global.fetch = originalFetch
    }
  })

  it("parses status webhooks into canonical events", async () => {
    const provider = new PathaoCourierProvider({}, {})

    const delivered = await provider.getWebhookActionAndData({
      data: {
        consignment_id: "PTH1",
        merchant_order_id: "ord_9",
        order_status: "delivered",
        delivery_fee: 130,
      },
      rawData: "{}",
      headers: {},
    })
    expect(delivered).toMatchObject({
      action: "status.changed",
      consignment_id: "PTH1",
      order_id: "ord_9",
      status: CourierShipmentStatus.DELIVERED,
      delivery_fee: 130,
    })

    const unknown = await provider.getWebhookActionAndData({
      data: { consignment_id: "PTH1", order_status: "????" },
      rawData: "{}",
      headers: {},
    })
    expect(unknown.action).toBe("not_supported")

    const missing = await provider.getWebhookActionAndData({
      data: { something: true },
      rawData: "{}",
      headers: {},
    })
    expect(missing.action).toBe("not_supported")
  })
})
