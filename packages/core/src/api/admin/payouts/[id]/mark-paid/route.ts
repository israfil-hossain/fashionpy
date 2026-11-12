import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  HttpTypes,
  IPayoutModuleService,
  MercurModules,
  PayoutStatus,
} from "@mercurjs/types"

import { refetchPayout } from "../../helpers"
import { AdminMarkPayoutPaidType } from "../../validators"

/**
 * Records a manually executed transfer: the local payout provider has
 * already recorded the instruction, and the operator marks it paid once the
 * money actually left the platform account.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminMarkPayoutPaidType>,
  res: MedusaResponse<HttpTypes.AdminPayoutResponse>
) => {
  const payoutService = req.scope.resolve<IPayoutModuleService>(
    MercurModules.PAYOUT
  )

  const { reference } = req.validatedBody

  const payout = await payoutService.retrievePayout(req.params.id)
  if (payout.status !== PayoutStatus.PROCESSING) {
    throw new MedusaError(
      MedusaError.Types.CONFLICT,
      `Payout ${payout.id} is ${payout.status}; only a processing payout can be marked paid`
    )
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

  const updated = await refetchPayout(
    payout.id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ payout: updated })
}
