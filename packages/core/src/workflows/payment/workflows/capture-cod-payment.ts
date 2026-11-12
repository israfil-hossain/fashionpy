import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { cancelPaymentStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { ORDER_FULFILLMENT_FIELDS } from "../../payout/utils/fulfillment-status"
import { CodCaptureOrder, decideCodCapture } from "../utils/cod-capture"
import { capturePaymentWorkflow } from "./payment-hooks"

export type CaptureCodPaymentWorkflowInput = {
  payment_id: string
}

export type CaptureCodPaymentWorkflowOutput = {
  payment_id: string
  action: "wait" | "capture" | "cancel"
  capturable_amount: BigNumberInput
  orders_total: number
}

export const captureCodPaymentWorkflowId = "capture-cod-payment"

type CodPaymentRow = {
  id: string
  provider_id: string
  amount: BigNumberInput
  raw_amount?: BigNumberInput | null
  captured_at?: Date | string | null
  canceled_at?: Date | string | null
  payment_collection?: { id: string } | null
  captures?: { amount: BigNumberInput; raw_amount?: BigNumberInput | null }[] | null
}

/**
 * `isList: false` makes `useQueryGraphStep` hand back the row itself instead
 * of a one-element array; normalize either shape to a single row.
 */
const firstRow = (data: unknown): CodPaymentRow | undefined =>
  (Array.isArray(data) ? data[0] : data) as CodPaymentRow | undefined

const capturedSum = (row: CodPaymentRow) =>
  (row.captures ?? []).reduce<BigNumberInput>(
    (sum, capture) => MathBN.add(sum, capture.raw_amount ?? capture.amount),
    0
  )

/**
 * Captures an authorized COD cart payment once every order of its cart is
 * delivered or canceled. Cash-on-delivery money exists only after the rider
 * collects it, so the capture — and with it the split and the payouts — waits
 * for delivery. Non-COD or already-settled payments are left alone.
 */
export const captureCodPaymentWorkflow = createWorkflow(
  captureCodPaymentWorkflowId,
  function (input: CaptureCodPaymentWorkflowInput) {
    const paymentData = useQueryGraphStep({
      entity: "payment",
      fields: [
        "id",
        "provider_id",
        "amount",
        "raw_amount",
        "captured_at",
        "canceled_at",
        "payment_collection.id",
        "captures.amount",
        "captures.raw_amount",
      ],
      filters: { id: input.payment_id },
      options: { isList: false, throwIfKeyNotFound: true },
    }).config({ name: "cod-payment-query" })

    const payment = transform({ paymentData }, ({ paymentData }) =>
      firstRow(paymentData.data)
    )

    const settled = transform({ payment }, ({ payment }) => {
      if (
        !payment ||
        payment.provider_id !== "pp_cod" ||
        payment.canceled_at ||
        payment.captured_at
      ) {
        return true
      }
      return MathBN.gt(capturedSum(payment), 0)
    })

    // Only a cart-level collection links to a cart; the per-order payments the
    // split creates have no cart link and are skipped.
    const cartIds = when(
      "cod-payment-cart",
      { payment, settled },
      ({ payment, settled }) => !settled && !!payment?.payment_collection?.id
    ).then(() => {
      const { data: links } = useQueryGraphStep({
        entity: "cart_payment_collection",
        fields: ["cart_id"],
        filters: {
          payment_collection_id: transform(
            { payment },
            ({ payment }) => payment?.payment_collection?.id ?? null
          ),
        },
      }).config({ name: "cod-cart-collection-query" })

      return transform({ links }, ({ links }) =>
        links.map((link) => link.cart_id).filter((id): id is string => !!id)
      )
    })

    const ordersData = when(
      "cod-payment-orders",
      { cartIds },
      ({ cartIds }) => !!cartIds?.length
    ).then(() => {
      const { data: orderCarts } = useQueryGraphStep({
        entity: "order_cart",
        fields: ["order_id"],
        filters: {
          cart_id: transform({ cartIds }, ({ cartIds }) => cartIds as string[]),
        },
      }).config({ name: "cod-order-cart-query" })

      const orderIds = transform({ orderCarts }, ({ orderCarts }) =>
        orderCarts.map((link) => link.order_id).filter((id): id is string => !!id)
      )

      const { data: orders } = useQueryGraphStep({
        entity: "order",
        fields: [
          "id",
          "status",
          "canceled_at",
          "total",
          ...ORDER_FULFILLMENT_FIELDS,
        ],
        filters: { id: orderIds },
      }).config({ name: "cod-orders-query" })

      return transform({ orders }, ({ orders }) => orders as unknown as CodCaptureOrder[])
    })

    const decision = transform({ ordersData, payment }, ({ ordersData, payment }) => {
      if (!payment) {
        // Payment vanished mid-flight — nothing to decide.
        return {
          payment_id: input.payment_id,
          action: "wait" as const,
          capturable_amount: 0 as BigNumberInput,
          orders_total: 0,
        }
      }
      const result = decideCodCapture({
        orders: (ordersData ?? []) as CodCaptureOrder[],
        authorized_amount: payment.raw_amount ?? payment.amount,
      })
      return {
        payment_id: payment.id,
        action: result.action,
        capturable_amount: result.capturable_amount,
        orders_total: result.orders_total,
      }
    })

    when("capture-cod-payment", { decision }, ({ decision }) =>
      decision.action === "capture"
    ).then(() => {
      capturePaymentWorkflow
        .runAsStep({
          input: {
            payment_id: input.payment_id,
            amount: transform({ decision }, ({ decision }) => decision.capturable_amount),
          },
        })
        .config({ name: "capture-cod" })
    })

    when("cancel-cod-payment", { decision }, ({ decision }) =>
      decision.action === "cancel"
    ).then(() => {
      cancelPaymentStep({ paymentIds: [input.payment_id] }).config({
        name: "cancel-cod",
      })
    })

    return new WorkflowResponse(
      transform({ decision }, ({ decision }) => decision as CaptureCodPaymentWorkflowOutput)
    )
  }
)
