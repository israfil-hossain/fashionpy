import { MedusaContainer } from "@medusajs/framework/types"
import { createPayoutReversalsWorkflow } from "@mercurjs/core/workflows"

import { runLocalJob, JobStats } from "../utils/run-job"
import { selectRefundOrderIds } from "../utils/selection"

/**
 * Takes the refunded share back from sellers whose payout already went out,
 * net of the commission on it; refunds landing before the payout were already
 * absorbed by the payout plan.
 */
export default async function payoutLocalProcessReversals(
  container: MedusaContainer
): Promise<JobStats | null> {
  return runLocalJob(container, "payout-local-process-reversals", async () => {
    const orderIds = await selectRefundOrderIds(container)
    if (!orderIds.length) {
      return { orders: 0 }
    }

    const { result } = await createPayoutReversalsWorkflow(container).run({
      input: { order_ids: orderIds },
    })

    return { orders: orderIds.length, ...result.counts }
  })
}

export const config = {
  name: "payout-local-process-reversals",
  schedule: "2-59/5 * * * *",
}
