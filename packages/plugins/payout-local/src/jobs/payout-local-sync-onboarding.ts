import { MedusaContainer } from "@medusajs/framework/types"
import { createOrRefreshSellerPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { runLocalJob, JobStats } from "../utils/run-job"
import { selectSellersWithoutAccount } from "../utils/selection"

/**
 * Creates the payout account of every open seller that has none, so the
 * vendor sees the "continue onboarding" panel and lands on the payout
 * details form instead of an empty section.
 */
export default async function payoutLocalSyncOnboarding(
  container: MedusaContainer
): Promise<JobStats | null> {
  return runLocalJob(container, "payout-local-sync-onboarding", async () => {
    const sellerIds = await selectSellersWithoutAccount(container)
    if (!sellerIds.length) {
      return { sellers: 0, created: 0 }
    }

    let created = 0
    for (const sellerId of sellerIds) {
      await createOrRefreshSellerPayoutAccountWorkflow(container).run({
        input: { seller_id: sellerId },
      })
      created += 1
    }

    return { sellers: sellerIds.length, created }
  })
}

export const config = {
  name: "payout-local-sync-onboarding",
  schedule: "3-59/5 * * * *",
}
