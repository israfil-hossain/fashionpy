import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"

import {
  FulfillableOrder,
  deriveFulfillmentStatus,
  fulfillmentReached,
} from "../../payout/utils/fulfillment-status"

export type CodCaptureOrder = FulfillableOrder & {
  id: string
  status: string
  canceled_at?: Date | string | null
  total: BigNumberInput
}

export type CodCaptureDecisionInput = {
  orders: CodCaptureOrder[]
  authorized_amount: BigNumberInput
}

export type CodCaptureDecision = {
  action: "wait" | "capture" | "cancel"
  capturable_amount: BigNumberInput
  orders_decided: number
  orders_total: number
}

const isCanceled = (order: CodCaptureOrder) =>
  order.status === "canceled" || !!order.canceled_at

/**
 * COD has no real authorization to expire, so the group is captured only
 * once every order is canceled or delivered: the capture deducts canceled
 * orders, and a group with nothing left is canceled instead. The amount is
 * what the surviving orders total — the courier collects exactly that in cash.
 */
export function decideCodCapture(input: CodCaptureDecisionInput): CodCaptureDecision {
  let canceledTotal: BigNumberInput = 0
  let decided = 0

  for (const order of input.orders) {
    if (isCanceled(order)) {
      canceledTotal = MathBN.add(canceledTotal, order.total)
      decided += 1
      continue
    }

    if (fulfillmentReached(deriveFulfillmentStatus(order), "delivered")) {
      decided += 1
    }
  }

  const capturable = MathBN.sub(input.authorized_amount, canceledTotal)
  const base = {
    capturable_amount: MathBN.gt(capturable, 0) ? capturable : 0,
    orders_decided: decided,
    orders_total: input.orders.length,
  }

  const allDecided = input.orders.length > 0 && decided === input.orders.length
  if (!allDecided) {
    return { ...base, action: "wait" }
  }
  if (MathBN.lte(capturable, 0)) {
    return { ...base, action: "cancel" }
  }
  return { ...base, action: "capture" }
}
