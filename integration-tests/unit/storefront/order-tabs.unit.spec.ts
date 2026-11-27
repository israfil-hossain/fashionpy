import {
  matchesOrderTab,
  type OrderForTab,
  type OrderStageRecord,
} from "../../../apps/storefront/src/lib/helpers/order-tabs"

const order: OrderForTab = {
  status: "completed",
  payment_status: "captured",
  fulfillment_status: "shipped",
}

describe("matchesOrderTab", () => {
  test("matches shipping and all for a shipped order", () => {
    expect(matchesOrderTab(order, "all")).toBe(true)
    expect(matchesOrderTab(order, "shipping")).toBe(true)
    expect(matchesOrderTab(order, "delivered")).toBe(false)
  })

  test("treats fulfilled as shipping and not fulfilled as pending", () => {
    expect(
      matchesOrderTab(
        { ...order, fulfillment_status: "fulfilled" },
        "shipping"
      )
    ).toBe(true)
    expect(
      matchesOrderTab(
        { ...order, fulfillment_status: "not_fulfilled" },
        "pending"
      )
    ).toBe(true)
  })

  test("delivered orders also appear in To Review", () => {
    const delivered: OrderForTab = { ...order, fulfillment_status: "delivered" }
    expect(matchesOrderTab(delivered, "delivered")).toBe(true)
    expect(matchesOrderTab(delivered, "to_review")).toBe(true)
  })

  test("derives returned, exchanged and refunded orders", () => {
    const returned: OrderStageRecord = { order_id: "ord_1", type: "return" }
    const exchanged: OrderStageRecord = {
      order_id: "ord_1",
      type: "exchange",
    }
    expect(matchesOrderTab(order, "returned", returned)).toBe(true)
    expect(matchesOrderTab(order, "exchanged", exchanged)).toBe(true)
    expect(matchesOrderTab(order, "returned", exchanged)).toBe(false)
    expect(
      matchesOrderTab(
        { ...order, payment_status: "refunded" },
        "refunded"
      )
    ).toBe(true)
  })

  test("derives cancelled orders", () => {
    expect(
      matchesOrderTab({ ...order, status: "canceled" }, "cancelled")
    ).toBe(true)
  })
})
