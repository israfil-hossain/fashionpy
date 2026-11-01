import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CourierShipmentStatus } from "@mercurjs/types"

import { markOrderFulfillmentAsDeliveredWorkflow } from "../../order/workflows/fulfillment-hooks"
import {
  applyCourierWebhookStatusStep,
  ApplyCourierWebhookStatusInput,
} from "../steps/apply-courier-webhook-status"

export interface ProcessCourierWebhookWorkflowInput
  extends ApplyCourierWebhookStatusInput {}

export const processCourierWebhookWorkflowId = "mercur-process-courier-webhook"

/**
 * Apply a courier status webhook: update the shipment and — the first time it
 * reaches DELIVERED — run mark-as-delivered so the patched
 * `fulfillmentDelivered` hook (money release) fires inside that workflow's
 * transaction. Duplicates are no-ops via the step's status guard.
 */
export const processCourierWebhookWorkflow = createWorkflow(
  processCourierWebhookWorkflowId,
  function (input: ProcessCourierWebhookWorkflowInput) {
    const outcome = applyCourierWebhookStatusStep(input)

    when({ outcome }, ({ outcome }) => {
      return outcome.applied && outcome.became_delivered
    }).then(() => {
      markOrderFulfillmentAsDeliveredWorkflow.runAsStep({
        input: {
          orderId: transform({ outcome }, ({ outcome }) => outcome.order_id!),
          fulfillmentId: transform(
            { outcome },
            ({ outcome }) => outcome.fulfillment_id!
          ),
        },
      })
    })

    return new WorkflowResponse(outcome)
  }
)

// re-export for consumers
export { CourierShipmentStatus }
