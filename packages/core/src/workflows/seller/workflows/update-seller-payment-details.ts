import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PaymentDetailsDTO, UpdatePaymentDetailsDTO } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { setPayoutAccountDetailsStep } from "../../payout/steps"
import { syncPayoutAccountWorkflow } from "../../payout/workflows"
import { updatePaymentDetailsStep } from "../steps/update-payment-details"

export const updateSellerPaymentDetailsWorkflowId =
  "update-seller-payment-details"

export type UpdateSellerPaymentDetailsWorkflowInput = {
  seller_id: string
  data: UpdatePaymentDetailsDTO
} & AdditionalData

export type UpdateSellerPaymentDetailsWorkflowHooks = [
  Hook<
    "paymentDetailsUpdated",
    {
      payment_details: PaymentDetailsDTO
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateSellerPaymentDetailsWorkflow: ReturnWorkflow<
  UpdateSellerPaymentDetailsWorkflowInput,
  PaymentDetailsDTO,
  UpdateSellerPaymentDetailsWorkflowHooks
> = createWorkflow(
  updateSellerPaymentDetailsWorkflowId,
  function (input: UpdateSellerPaymentDetailsWorkflowInput) {
    const paymentDetails = updatePaymentDetailsStep(input)

    // A seller with a payout account gets the new destination stored on it
    // and the account re-synced, so a submitted form activates payouts (and
    // queues the seller's held orders through `payout_account.updated`).
    const sellerAccount = useQueryGraphStep({
      entity: "seller",
      fields: ["id", "payout_account.id"],
      filters: { id: input.seller_id },
    }).config({ name: "payment-details-payout-account-query" })

    when(
      "seller-has-payout-account",
      { sellerAccount },
      ({ sellerAccount }) => !!sellerAccount.data[0]?.payout_account?.id
    ).then(() => {
      setPayoutAccountDetailsStep({
        account_id: transform(
          { sellerAccount },
          ({ sellerAccount }) =>
            sellerAccount.data[0].payout_account?.id as string
        ),
        details: transform({ paymentDetails }, ({ paymentDetails }) => ({
          payout_method: paymentDetails.payout_method ?? null,
          holder_name: paymentDetails.holder_name ?? null,
          bank_name: paymentDetails.bank_name ?? null,
          iban: paymentDetails.iban ?? null,
          bic: paymentDetails.bic ?? null,
          routing_number: paymentDetails.routing_number ?? null,
          account_number: paymentDetails.account_number ?? null,
          wallet_number: paymentDetails.wallet_number ?? null,
          country_code: paymentDetails.country_code ?? null,
        })),
      })

      syncPayoutAccountWorkflow.runAsStep({
        input: {
          id: transform(
            { sellerAccount },
            ({ sellerAccount }) =>
              sellerAccount.data[0].payout_account?.id as string
          ),
        },
      })
    })

    const paymentDetailsUpdated = createHook("paymentDetailsUpdated", {
      payment_details: paymentDetails,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(paymentDetails, {
      hooks: [paymentDetailsUpdated],
    })
  }
)
