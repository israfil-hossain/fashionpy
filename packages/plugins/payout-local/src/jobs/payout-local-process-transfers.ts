import { MedusaContainer } from "@medusajs/framework/types"
import { createOrderPayoutsWorkflow } from "@mercurjs/core/workflows"

import { runLocalJob, JobStats } from "../utils/run-job"
import { REQUIRED_FULFILLMENT_STATUS, selectPayoutOrderIds } from "../utils/selection"

/**
 * The payout backstop: re-decides held and failed payouts and picks up
 * orders no subscriber run got to, paying out each order's seller their
 * share (total minus commission) once it is ready.
 */
export default async function payoutLocalProcessTransfers(
  container: MedusaContainer
): Promise<JobStats | null> {
  return runLocalJob(container, "payout-local-process-transfers", async () => {
    const orderIds = await selectPayoutOrderIds(container)
    if (!orderIds.length) {
      return { orders: 0 }
    }

    const { result } = await createOrderPayoutsWorkflow(container).run({
      input: {
        order_ids: orderIds,
        required_fulfillment_status: REQUIRED_FULFILLMENT_STATUS,
      },
    })

    return { orders: orderIds.length, ...result.counts }
  })
}

export const config = {
  name: "payout-local-process-transfers",
  schedule: "1-59/5 * * * *",
}
