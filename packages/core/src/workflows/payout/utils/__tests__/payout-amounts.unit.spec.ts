import { PayoutStatus, PayoutStatusReason } from "@mercurjs/types"

import { fulfillmentReached } from "../fulfillment-status"
import { codShipmentsAwaitingRemittance, decideOrderPayout, decideReversal } from "../payout-amounts"
import { sentToProvider } from "../sent-to-provider"

const order = (overrides: Partial<Parameters<typeof decideOrderPayout>[0]["order"]> = {}) => ({
  id: "order_1",
  seller_id: "sel_1",
  status: "pending",
  canceled_at: null,
  fulfillment_status: "fulfilled",
  total: 180,
  currency_code: "eur",
  created_at: new Date("2026-10-21T14:12:00Z"),
  ...overrides,
})

const codShipment = (
  overrides: Partial<Parameters<typeof codShipmentsAwaitingRemittance>[0][number]> = {}
) => ({
  id: "cshp_1",
  order_id: "order_1",
  cod_amount: 180,
  status: "delivered",
  cod_remitted_at: null,
  ...overrides,
})

const account = { id: "pacc_1", payouts_enabled: true }
const payment = {
  id: "pay_1",
  captured: true,
  canceled: false,
  fully_refunded: false,
  data: { id: "pi_1", latest_charge: "ch_1" },
}

const base = {
  order: order(),
  account,
  payment,
  commission_total: 18,
  required_fulfillment_status: "fulfilled" as const,
}

describe("decideOrderPayout", () => {
  it("holds when the seller has no account", () => {
    const decision = decideOrderPayout({ ...base, account: null })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.ACCOUNT_NOT_READY)
    expect(decision.status_detail).toBe("Cannot find payout account for seller sel_1")
  })

  it("holds when payouts are disabled on the account", () => {
    const decision = decideOrderPayout({ ...base, account: { ...account, payouts_enabled: false } })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.ACCOUNT_PAYOUTS_DISABLED)
  })

  it("aborts a canceled order", () => {
    const decision = decideOrderPayout({ ...base, order: order({ status: "canceled" }) })
    expect(decision.status).toBe(PayoutStatus.ABORTED)
    expect(decision.status_reason).toBe(PayoutStatusReason.ORDER_ABORTED)
    expect(decision.status_detail).toBe("Order cannot be processed, status is canceled")
  })

  it("aborts a canceled order even when the seller has no usable account", () => {
    expect(decideOrderPayout({ ...base, account: null, order: order({ status: "canceled" }) }).status).toBe(
      PayoutStatus.ABORTED
    )
    expect(
      decideOrderPayout({
        ...base,
        account: { ...account, payouts_enabled: false },
        order: order({ canceled_at: new Date() }),
      }).status
    ).toBe(PayoutStatus.ABORTED)
  })

  it("holds an order below the required fulfillment status", () => {
    const decision = decideOrderPayout({ ...base, order: order({ fulfillment_status: "partially_fulfilled" }) })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.ORDER_NOT_READY)
    expect(decision.status_detail).toBe("Order is not ready yet, status is partially_fulfilled")
  })

  it("holds an authorized but uncaptured payment", () => {
    const decision = decideOrderPayout({ ...base, payment: { ...payment, captured: false } })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.PAYMENT_NOT_READY)
    expect(decision.status_detail).toBe("Payment pay_1 is not ready yet, status is authorized")
  })

  it("aborts a canceled or fully refunded payment", () => {
    expect(decideOrderPayout({ ...base, payment: { ...payment, canceled: true } }).status).toBe(PayoutStatus.ABORTED)
    expect(decideOrderPayout({ ...base, payment: { ...payment, fully_refunded: true } }).status).toBe(PayoutStatus.ABORTED)
  })

  it("aborts when total minus commission is not positive", () => {
    const decision = decideOrderPayout({ ...base, commission_total: 180 })
    expect(decision.status).toBe(PayoutStatus.ABORTED)
    expect(decision.status_reason).toBe(PayoutStatusReason.INVALID_AMOUNT)
    expect(decision.status_detail).toBe("Amount must be positive, input was: 0")
  })

  it("rounds the payout to the currency precision", () => {
    const decision = decideOrderPayout({ ...base, order: order({ total: 265.5 }), commission_total: 18.375 })
    expect(Number(decision.amount)).toBe(247.13)
  })

  it("is pending for total minus commission", () => {
    const decision = decideOrderPayout(base)
    expect(decision.status).toBe(PayoutStatus.PENDING)
    expect(decision.status_reason).toBeNull()
    expect(Number(decision.amount)).toBe(162)
  })

  it("holds until the courier remitted the COD cash", () => {
    const decision = decideOrderPayout({ ...base, cod_shipments: [codShipment()] })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.COD_NOT_REMITTED)
    expect(decision.status_detail).toBe(
      "COD cash for shipment cshp_1 has not been remitted yet"
    )
    expect(Number(decision.amount)).toBe(0)
  })

  it("pays once the COD shipment is marked remitted", () => {
    const decision = decideOrderPayout({
      ...base,
      cod_shipments: [codShipment({ cod_remitted_at: new Date("2026-11-01T10:00:00Z") })],
    })
    expect(decision.status).toBe(PayoutStatus.PENDING)
    expect(Number(decision.amount)).toBe(162)
  })

  it("ignores shipments the courier collected nothing for", () => {
    for (const status of ["canceled", "failed", "returned"]) {
      const decision = decideOrderPayout({ ...base, cod_shipments: [codShipment({ status })] })
      expect(decision.status).toBe(PayoutStatus.PENDING)
    }
    expect(
      decideOrderPayout({ ...base, cod_shipments: [codShipment({ cod_amount: 0 })] }).status
    ).toBe(PayoutStatus.PENDING)
  })

  it("keeps the payment check ahead of the remittance check", () => {
    const decision = decideOrderPayout({
      ...base,
      payment: { ...payment, captured: false },
      cod_shipments: [codShipment()],
    })
    expect(decision.status_reason).toBe(PayoutStatusReason.PAYMENT_NOT_READY)
  })
})

describe("codShipmentsAwaitingRemittance", () => {
  it("lists unremitted COD shipments with cash to collect", () => {
    const awaiting = codShipmentsAwaitingRemittance([
      codShipment(),
      codShipment({ id: "cshp_2", cod_remitted_at: new Date() }),
      codShipment({ id: "cshp_3", status: "in_transit" }),
      codShipment({ id: "cshp_4", status: "returned" }),
      codShipment({ id: "cshp_5", cod_amount: null }),
    ])
    expect(awaiting.map((shipment) => shipment.id)).toEqual(["cshp_1", "cshp_3"])
  })

  it("is empty without shipments", () => {
    expect(codShipmentsAwaitingRemittance(undefined)).toEqual([])
    expect(codShipmentsAwaitingRemittance([])).toEqual([])
  })
})

describe("fulfillmentReached", () => {
  it("walks the ordered scale and never counts canceled", () => {
    expect(fulfillmentReached("shipped", "fulfilled")).toBe(true)
    expect(fulfillmentReached("not_fulfilled", "fulfilled")).toBe(false)
    expect(fulfillmentReached("canceled", "not_fulfilled")).toBe(false)
  })
})

describe("decideReversal", () => {
  const payout = { id: "pout_1", status: PayoutStatus.PAID, provider_payout_id: "tr_1" }

  it("reverses the refund net of its commission share", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      payout,
    })
    expect(decision.status).toBe(PayoutStatus.PENDING)
    expect(Number(decision.amount)).toBe(54)
  })

  it("rounds the reversal to the currency precision", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60.05,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      currency_code: "eur",
      payout,
    })
    expect(Number(decision.amount)).toBe(54.05)
  })

  it("holds until the order payout is paid", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      payout: { ...payout, status: PayoutStatus.ON_HOLD, provider_payout_id: null },
    })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.PAYOUT_NOT_READY)
  })

  it("aborts when the order payout was aborted", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      payout: { ...payout, status: PayoutStatus.ABORTED },
    })
    expect(decision.status).toBe(PayoutStatus.ABORTED)
    expect(decision.status_reason).toBe(PayoutStatusReason.REFUND_ABORTED)
    expect(decision.status_detail).toBe("Refund ref_1 has been aborted")
  })
})

describe("sentToProvider", () => {
  it("counts a processing or paid row as sent", () => {
    expect(sentToProvider({ status: PayoutStatus.PROCESSING })).toBe(true)
    expect(sentToProvider({ status: PayoutStatus.PAID })).toBe(true)
  })

  it("counts a failed row as sent when it was attempted after the snapshot", () => {
    expect(sentToProvider({ status: PayoutStatus.FAILED, data: { attempts: 1 } })).toBe(true)
    expect(sentToProvider({ status: PayoutStatus.FAILED, data: { attempts: 2 } }, { data: { attempts: 1 } })).toBe(true)
  })

  it("leaves a row that never reached the provider restorable", () => {
    expect(sentToProvider({ status: PayoutStatus.PENDING, data: {} })).toBe(false)
    expect(sentToProvider({ status: PayoutStatus.ON_HOLD, data: { attempts: 1 } }, { data: { attempts: 1 } })).toBe(false)
  })
})
