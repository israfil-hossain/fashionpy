import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createOrderShipmentWorkflow } from "@medusajs/medusa/core-flows"
import { CourierDeliveryType, CreateCourierShipmentDTO } from "@mercurjs/types"

import {
  bookCourierShipmentStep,
  loadOrderFulfillmentContextStep,
} from "../steps"

export interface CreateCourierShipmentWorkflowInput
  extends Omit<
    CreateCourierShipmentDTO,
    | "recipient_name"
    | "recipient_phone"
    | "recipient_address"
    | "weight"
    | "item_count"
  > {
  weight?: number
  delivery_type?: CourierDeliveryType
}

/**
 * Book a consignment at the courier, then attach the tracking labels to the
 * fulfillment. Booking runs first: an external consignment can't be rolled
 * back, while the local shipment can be retried if it fails afterwards.
 */
export const createCourierShipmentWorkflow = createWorkflow(
  "mercur-create-courier-shipment",
  function (input: CreateCourierShipmentWorkflowInput) {
    const context = loadOrderFulfillmentContextStep({
      order_id: input.order_id,
      fulfillment_id: input.fulfillment_id,
    })

    const shipmentInput = transform(
      { input, context },
      ({ input, context }) => ({
        provider: input.provider,
        seller_id: input.seller_id,
        order_id: input.order_id,
        fulfillment_id: input.fulfillment_id,
        recipient_name: context.recipient.name,
        recipient_phone: context.recipient.phone,
        recipient_secondary_phone: context.recipient.secondary_phone,
        recipient_address: context.recipient.address,
        recipient_city: context.recipient.city,
        recipient_postal_code: context.recipient.postal_code,
        recipient_country_code: context.recipient.country_code,
        weight: input.weight && input.weight > 0 ? input.weight : context.weight,
        item_count: context.item_count,
        item_description: input.item_description,
        special_instruction: input.special_instruction,
        cod_amount: input.cod_amount,
        currency_code: input.currency_code,
        delivery_type: input.delivery_type,
      })
    )

    const shipment = bookCourierShipmentStep(shipmentInput as any)

    // runAsStep takes `{ input }` — the nested workflow's own input shape
    createOrderShipmentWorkflow.runAsStep({
      input: {
        order_id: input.order_id,
        fulfillment_id: input.fulfillment_id,
        items: transform({ context }, ({ context }) => context.shipment_items),
        labels: transform({ shipment }, ({ shipment }) => {
          const trackingUrl = shipment.tracking_url ?? ""
          return [
            {
              tracking_number: shipment.tracking_code ?? shipment.consignment_id,
              tracking_url: trackingUrl,
              label_url: trackingUrl,
            },
          ]
        }),
      },
    })

    return new WorkflowResponse(shipment)
  }
)
