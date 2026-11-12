import { CodCaptureOrder, decideCodCapture } from "../cod-capture"

const order = (overrides: Partial<CodCaptureOrder> = {}): CodCaptureOrder => ({
  id: "ord_1",
  status: "pending",
  canceled_at: null,
  total: 100,
  items: [{ id: "item_1", quantity: 1 }],
  fulfillments: [],
  ...overrides,
})

const delivered = (overrides: Partial<CodCaptureOrder> = {}): CodCaptureOrder =>
  order({
    fulfillments: [{ delivered_at: new Date("2026-11-01T10:00:00Z"), items: [{ line_item_id: "item_1", quantity: 1 }] }],
    ...overrides,
  })

describe("decideCodCapture", () => {
  it("waits until every order is canceled or delivered", () => {
    const decision = decideCodCapture({
      orders: [delivered(), order({ id: "ord_2", fulfillments: [{ shipped_at: new Date(), items: [{ line_item_id: "item_1", quantity: 1 }] }] })],
      authorized_amount: 200,
    })
    expect(decision.action).toBe("wait")
    expect(decision.orders_decided).toBe(1)
    expect(decision.orders_total).toBe(2)
  })

  it("captures the group total once all orders are delivered", () => {
    const decision = decideCodCapture({
      orders: [delivered(), delivered({ id: "ord_2", total: 150 })],
      authorized_amount: 250,
    })
    expect(decision.action).toBe("capture")
    expect(Number(decision.capturable_amount)).toBe(250)
  })

  it("deducts canceled orders from the captured amount", () => {
    const decision = decideCodCapture({
      orders: [delivered(), order({ id: "ord_2", status: "canceled", total: 80 })],
      authorized_amount: 180,
    })
    expect(decision.action).toBe("capture")
    expect(Number(decision.capturable_amount)).toBe(100)
  })

  it("cancels when every order is canceled", () => {
    const decision = decideCodCapture({
      orders: [order({ status: "canceled" }), order({ id: "ord_2", status: "canceled" })],
      authorized_amount: 200,
    })
    expect(decision.action).toBe("cancel")
    expect(Number(decision.capturable_amount)).toBe(0)
  })

  it("waits with an empty group instead of acting", () => {
    expect(decideCodCapture({ orders: [], authorized_amount: 100 }).action).toBe("wait")
  })

  it("waits when only part of the order is delivered", () => {
    const decision = decideCodCapture({
      orders: [
        delivered({
          fulfillments: [
            {
              delivered_at: new Date("2026-11-01T10:00:00Z"),
              items: [{ line_item_id: "item_1", quantity: 1 }],
            },
          ],
          items: [{ id: "item_1", quantity: 2 }],
        }),
      ],
      authorized_amount: 100,
    })
    expect(decision.action).toBe("wait")
  })
})
