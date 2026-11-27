export const ORDER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "shipping", label: "Shipping" },
  { key: "delivered", label: "Delivered" },
  { key: "to_review", label: "To Review" },
  { key: "returned", label: "Returned" },
  { key: "exchanged", label: "Exchanged" },
  { key: "refunded", label: "Refunded" },
  { key: "cancelled", label: "Cancelled" },
] as const

export type OrderTabKey = (typeof ORDER_TABS)[number]["key"]

export type OrderForTab = {
  status?: string | null
  payment_status?: string | null
  fulfillment_status?: string | null
}

export type OrderStageRecord = {
  order_id?: string | null
  type?: string | null
  status?: string | null
}

const isShipping = (status?: string | null) =>
  status === "fulfilled" ||
  status === "partially_fulfilled" ||
  status === "shipped" ||
  status === "partially_shipped"

const isDelivered = (status?: string | null) =>
  status === "delivered" || status === "partially_delivered"

const isRefunded = (status?: string | null) =>
  status === "refunded" || status === "partially_refunded"

export const matchesOrderTab = (
  order: OrderForTab,
  tab: OrderTabKey,
  stage?: OrderStageRecord | null
): boolean => {
  const cancelled =
    order.status === "canceled" ||
    order.fulfillment_status === "canceled" ||
    order.payment_status === "canceled"
  const refunded = isRefunded(order.payment_status)
  const exchanged = stage?.type?.toLowerCase().includes("exchange") ?? false
  const returned = Boolean(stage) && !exchanged
  const delivered = isDelivered(order.fulfillment_status)
  const shipping = isShipping(order.fulfillment_status)
  const pending =
    order.status === "pending" ||
    order.status === "requires_action" ||
    order.payment_status === "awaiting" ||
    order.payment_status === "not_paid" ||
    order.payment_status === "requires_action" ||
    order.fulfillment_status === "not_fulfilled"

  switch (tab) {
    case "all":
      return true
    case "pending":
      return pending && !cancelled
    case "shipping":
      return shipping && !cancelled
    case "delivered":
      return delivered && !returned && !refunded && !cancelled
    case "to_review":
      return delivered && !returned && !refunded && !cancelled
    case "returned":
      return returned && !exchanged
    case "exchanged":
      return exchanged
    case "refunded":
      return refunded || stage?.status?.toLowerCase().includes("refund") === true
    case "cancelled":
      return cancelled
  }
}
