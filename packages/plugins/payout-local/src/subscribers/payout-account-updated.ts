import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PayoutAccountStatus, PayoutModuleEvents } from "@mercurjs/types"
import { createOrderPayoutsWorkflow } from "@mercurjs/core/workflows"

import {
  REQUIRED_FULFILLMENT_STATUS,
  selectSellerOrdersWithoutPayout,
} from "../utils/selection"

/**
 * The seller just finished their payout details, so their account went
 * active: pay out the orders that were waiting for it.
 */
export default async function payoutLocalAccountUpdatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: accounts } = await query.graph({
    entity: "payout_account",
    fields: ["id", "status", "seller.id"],
    filters: { id: event.data.id },
  })

  const account = accounts[0] as
    | { status?: string; seller?: { id?: string } | null }
    | undefined

  if (
    account?.status !== PayoutAccountStatus.ACTIVE ||
    !account.seller?.id
  ) {
    return
  }

  const orderIds = await selectSellerOrdersWithoutPayout(container, account.seller.id)
  if (!orderIds.length) {
    return
  }

  await createOrderPayoutsWorkflow(container).run({
    input: {
      order_ids: orderIds,
      required_fulfillment_status: REQUIRED_FULFILLMENT_STATUS,
    },
  })
}

export const config: SubscriberConfig = {
  event: PayoutModuleEvents.ACCOUNT_UPDATED,
  context: { subscriberId: "payout-local-account-updated" },
}
