import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  IPayoutModuleService,
  MercurModules,
  PayoutStatus,
} from "@mercurjs/types"

import { AdminBulkMarkPayoutPaidType } from "../validators"

type MarkPaidResult = {
  paid: string[]
  skipped: { id: string; status: string }[]
}

const MAX_BATCH = 200

/**
 * Bulk version of the single mark-paid action: pays every processing payout
 * of the batch and reports the ones it left alone, so one stale row does not
 * fail the whole transfer run.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBulkMarkPayoutPaidType>,
  res: MedusaResponse<{ result: MarkPaidResult }>
) => {
  const payoutService = req.scope.resolve<IPayoutModuleService>(
    MercurModules.PAYOUT
  )

  const { ids, reference } = req.validatedBody
  const uniqueIds = Array.from(new Set(ids)).slice(0, MAX_BATCH)

  const payouts = await payoutService.listPayouts(
    { id: uniqueIds },
    { select: ["id", "status", "data"] }
  )

  const result: MarkPaidResult = { paid: [], skipped: [] }

  for (const payout of payouts) {
    if (payout.status !== PayoutStatus.PROCESSING) {
      result.skipped.push({ id: payout.id, status: payout.status })
      continue
    }

    await payoutService.updatePayouts({
      id: payout.id,
      status: PayoutStatus.PAID,
      data: {
        ...(payout.data ?? {}),
        ...(reference ? { reference } : {}),
        marked_paid_at: new Date().toISOString(),
        marked_paid_by: req.auth_context?.actor_id ?? null,
      },
    })
    result.paid.push(payout.id)
  }

  const found = new Set(payouts.map((payout) => payout.id))
  for (const id of uniqueIds) {
    if (!found.has(id)) {
      result.skipped.push({ id, status: "not_found" })
    }
  }

  res.json({ result })
}
