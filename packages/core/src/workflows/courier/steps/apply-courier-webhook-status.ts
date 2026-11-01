import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  CourierShipmentStatus,
  MercurModules,
} from "@mercurjs/types"

import type CourierModuleService from "../../../modules/courier/services/courier-module-service"

export const applyCourierWebhookStatusStepId =
  "apply-courier-webhook-status-step"

export interface ApplyCourierWebhookStatusInput {
  provider: string
  consignment_id: string
  order_id?: string
  status: CourierShipmentStatus
  delivery_fee?: number
  raw?: Record<string, unknown>
}

export interface ApplyCourierWebhookStatusResult {
  applied: boolean
  /** became_delivered — first time the shipment reached DELIVERED */
  became_delivered: boolean
  order_id?: string
  fulfillment_id?: string
}

/**
 * Apply a canonical courier status onto the stored shipment.
 *
 * Idempotent by design: duplicate webhooks (same status) are ignored, unknown
 * consignments are acknowledged as a no-op, and `became_delivered` is only set
 * on the first transition INTO delivered — that gates the mark-as-delivered
 * workflow (and the `fulfillmentDelivered` money-release hook) exactly once.
 */
export const applyCourierWebhookStatusStep = createStep(
  applyCourierWebhookStatusStepId,
  async (
    input: ApplyCourierWebhookStatusInput,
    { container }
  ) => {
    const courierService = container.resolve<CourierModuleService>(
      MercurModules.COURIER
    )

    const shipments = await courierService.listCourierShipments({
      provider: input.provider,
      consignment_id: input.consignment_id,
    })
    const shipment = shipments[0]
    if (!shipment) {
      // Unknown consignment — acknowledge as a no-op (consistent string
      // compensation so the step's response type stays a single shape)
      return new StepResponse(
        { applied: false, became_delivered: false } as ApplyCourierWebhookStatusResult,
        ""
      )
    }

    if (shipment.status === input.status) {
      // Duplicate webhook — already reflected
      return new StepResponse(
        {
          applied: false,
          became_delivered: false,
          order_id: shipment.order_id,
          fulfillment_id: shipment.fulfillment_id,
        },
        shipment.id
      )
    }

    const becameDelivered =
      input.status === CourierShipmentStatus.DELIVERED &&
      shipment.status !== CourierShipmentStatus.DELIVERED

    await courierService.updateCourierShipments({
      id: shipment.id,
      status: input.status,
      ...(input.delivery_fee != null
        ? { delivery_fee: input.delivery_fee }
        : {}),
      data: {
        ...(shipment.data ?? {}),
        ...(input.raw ?? {}),
      },
    })

    const result: ApplyCourierWebhookStatusResult = {
      applied: true,
      became_delivered: becameDelivered,
      order_id: shipment.order_id,
      fulfillment_id: shipment.fulfillment_id,
    }

    return new StepResponse(result, shipment.id)
  }
)
