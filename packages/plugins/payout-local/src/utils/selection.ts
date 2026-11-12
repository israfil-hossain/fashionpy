import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { PayoutStatus, SellerStatus } from "@mercurjs/types"

/**
 * Sellers are paid out once their orders are delivered: COD cash exists only
 * after the rider collects it, and prepaid money is not released early either.
 */
export const REQUIRED_FULFILLMENT_STATUS = "delivered" as const

/** How far back the backstop scans for orders a subscriber run missed. */
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

const PAGE = 100

const dedupe = (ids: (string | null | undefined)[]) =>
  Array.from(new Set(ids.filter((id): id is string => !!id)))

/**
 * Orders to re-decide this run: every held or failed payout's order plus a
 * page of recent orders that have no payout row yet (event subscribers cover
 * the live paths; this is the backstop).
 */
export async function selectPayoutOrderIds(
  container: MedusaContainer
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: held } = await query.graph({
    entity: "payout",
    fields: ["order_id"],
    filters: { status: [PayoutStatus.ON_HOLD, PayoutStatus.FAILED], order_id: { $ne: null } },
    pagination: { take: PAGE },
  })

  const { data: recent } = await query.graph({
    entity: "order",
    fields: ["id"],
    filters: { created_at: { $gte: new Date(Date.now() - RECENT_WINDOW_MS) } },
    pagination: { take: PAGE, order: { created_at: "DESC" } },
  })
  const recentIds = recent.map((order) => order.id as string)

  const { data: existing } = recentIds.length
    ? await query.graph({
        entity: "payout",
        fields: ["order_id"],
        filters: { order_id: recentIds },
      })
    : { data: [] as { order_id: string | null }[] }
  const withPayout = new Set(existing.map((payout) => payout.order_id))

  return dedupe([
    ...held.map((payout) => payout.order_id as string),
    ...recentIds.filter((id) => !withPayout.has(id)),
  ])
}

/**
 * Authorized COD payments that have not been captured or canceled yet —
 * the capture job decides each one against its orders' delivery state.
 */
export async function selectCodPaymentIds(
  container: MedusaContainer
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: payments } = await query.graph({
    entity: "payment",
    fields: ["id", "captured_at", "canceled_at", "captures.amount", "captures.raw_amount"],
    filters: { provider_id: "pp_cod" },
    pagination: { take: PAGE },
  })

  return payments
    .filter((payment) => {
      if (payment.captured_at || payment.canceled_at) {
        return false
      }
      const captured = (payment.captures ?? []).reduce(
        (sum: number, capture: { amount: number | string; raw_amount?: number | string | null }) =>
          sum + Number(capture.raw_amount ?? capture.amount ?? 0),
        0
      )
      return captured <= 0
    })
    .map((payment) => payment.id as string)
}

/**
 * Orders whose refunds may need a payout reversal: refunds created in the
 * backstop window plus a page of failed or held reversals.
 */
export async function selectRefundOrderIds(
  container: MedusaContainer
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: refunds } = await query.graph({
    entity: "refund",
    fields: ["id", "payment.payment_collection.order.id"],
    filters: { created_at: { $gte: new Date(Date.now() - RECENT_WINDOW_MS) } },
    pagination: { take: PAGE },
  })

  const { data: failed } = await query.graph({
    entity: "payout_reversal",
    fields: ["payout.order_id"],
    filters: { status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD] },
    pagination: { take: PAGE },
  })

  return dedupe([
    ...refunds.map(
      (refund) =>
        (refund as { payment?: { payment_collection?: { order?: { id?: string } | null } | null } | null })
          .payment?.payment_collection?.order?.id
    ),
    ...failed.map(
      (reversal) =>
        (reversal as { payout?: { order_id?: string | null } | null }).payout?.order_id
    ),
  ])
}

/**
 * Open sellers (approved or awaiting approval) that have no payout account
 * yet — the onboarding job creates one so the vendor can submit details.
 */
export async function selectSellersWithoutAccount(
  container: MedusaContainer
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links } = await query.graph({
    entity: "seller_payout_account",
    fields: ["seller_id"],
    pagination: { take: 5000 },
  })
  const withAccount = new Set(
    links.map((link) => link.seller_id as string).filter(Boolean)
  )

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { status: [SellerStatus.OPEN, SellerStatus.PENDING_APPROVAL] },
    pagination: { take: PAGE, order: { updated_at: "DESC" } },
  })

  return sellers
    .map((seller) => seller.id as string)
    .filter((id) => !withAccount.has(id))
}

/**
 * The orders of a seller that do not have a payout row yet — queued when
 * their payout account becomes active.
 */
export async function selectSellerOrdersWithoutPayout(
  container: MedusaContainer,
  sellerId: string
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links } = await query.graph({
    entity: "order_seller",
    fields: ["order_id"],
    filters: { seller_id: sellerId },
    pagination: { take: PAGE },
  })
  const orderIds = dedupe(links.map((link) => link.order_id as string))
  if (!orderIds.length) {
    return []
  }

  const { data: existing } = await query.graph({
    entity: "payout",
    fields: ["order_id"],
    filters: { order_id: orderIds },
  })
  const withPayout = new Set(existing.map((payout) => payout.order_id))

  return orderIds.filter((id) => !withPayout.has(id))
}
