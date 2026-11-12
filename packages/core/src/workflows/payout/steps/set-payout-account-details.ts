import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { IPayoutModuleService, MercurModules } from "@mercurjs/types"

export type SetPayoutAccountDetailsStepInput = {
  account_id: string
  details: Record<string, unknown>
}

export const setPayoutAccountDetailsStepId = "set-payout-account-details"

/**
 * Stores the seller's payout destination on the payout account. The local
 * provider derives the account's state (and where a payout is sent) from
 * `data.payout_details`, so this is the input its `retrieveAccount` reads.
 */
export const setPayoutAccountDetailsStep = createStep(
  setPayoutAccountDetailsStepId,
  async (input: SetPayoutAccountDetailsStepInput, { container }) => {
    const service = container.resolve<IPayoutModuleService>(
      MercurModules.PAYOUT
    )

    const previous = await service.retrievePayoutAccount(input.account_id)
    const updated = await service.updatePayoutAccounts({
      id: input.account_id,
      data: {
        ...(previous.data ?? {}),
        payout_details: input.details,
      },
    })

    return new StepResponse(updated, {
      id: previous.id,
      data: previous.data,
    })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    await container
      .resolve<IPayoutModuleService>(MercurModules.PAYOUT)
      .updatePayoutAccounts(previous)
  }
)
