import { MedusaContainer } from "@medusajs/framework/types"
import { captureCodPaymentWorkflow } from "@mercurjs/core/workflows"

import { runLocalJob, JobStats } from "../utils/run-job"
import { selectCodPaymentIds } from "../utils/selection"

/**
 * Captures authorized COD payments whose orders are all delivered (or
 * canceled) — the cash exists only after the rider collects it, and the
 * capture is what lets the split and the payouts proceed.
 */
export default async function payoutLocalCodCapture(
  container: MedusaContainer
): Promise<JobStats | null> {
  return runLocalJob(container, "payout-local-cod-capture", async () => {
    const paymentIds = await selectCodPaymentIds(container)

    let captured = 0
    let canceled = 0
    for (const paymentId of paymentIds) {
      const { result } = await captureCodPaymentWorkflow(container).run({
        input: { payment_id: paymentId },
      })
      if (result.action === "capture") {
        captured += 1
      } else if (result.action === "cancel") {
        canceled += 1
      }
    }

    return { scanned: paymentIds.length, captured, canceled }
  })
}

export const config = {
  name: "payout-local-cod-capture",
  schedule: "0-59/5 * * * *",
}
