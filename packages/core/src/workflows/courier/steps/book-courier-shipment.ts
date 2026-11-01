import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { CreateCourierShipmentDTO, MercurModules } from "@mercurjs/types"

import type CourierModuleService from "../../../modules/courier/services/courier-module-service"

export const bookCourierShipmentStepId = "book-courier-shipment-step"

/**
 * Books the consignment at the courier (external API call — runs before the
 * local shipment records so a failed booking never leaves orphan labels).
 */
export const bookCourierShipmentStep = createStep(
  bookCourierShipmentStepId,
  async (input: CreateCourierShipmentDTO, { container }) => {
    const courierService = container.resolve<CourierModuleService>(
      MercurModules.COURIER
    )

    const shipment = await courierService.bookShipment(input)
    return new StepResponse(shipment, shipment.id)
  }
)

export const loadOrderFulfillmentContextStepId =
  "load-order-fulfillment-context-step"

export interface OrderFulfillmentContext {
  order_id: string
  fulfillment_id: string
  recipient: {
    name: string
    phone: string
    secondary_phone?: string
    address: string
    city?: string
    postal_code?: string
    country_code?: string
  }
  weight: number
  item_count: number
  shipment_items: { id: string; quantity: number }[]
}

/**
 * Loads the order's shipping address + fulfillment items and derives the
 * courier booking inputs (recipient, total weight, item count).
 */
export const loadOrderFulfillmentContextStep = createStep(
  loadOrderFulfillmentContextStepId,
  async (
    input: { order_id: string; fulfillment_id: string },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.phone",
        "shipping_address.address_1",
        "shipping_address.address_2",
        "shipping_address.city",
        "shipping_address.postal_code",
        "shipping_address.country_code",
        "fulfillments.id",
        "fulfillments.items.line_item_id",
        "fulfillments.items.quantity",
        "items.quantity",
        "items.variant.weight",
      ],
      filters: { id: input.order_id },
    })

    const order = orders?.[0]
    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order ${input.order_id} not found for courier booking`
      )
    }

    const fulfillment = (order.fulfillments ?? []).find(
      (f: any) => f.id === input.fulfillment_id
    )
    if (!fulfillment) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Fulfillment ${input.fulfillment_id} does not belong to order ${input.order_id}`
      )
    }

    const address = order.shipping_address
    if (!address?.first_name || !address.phone || !address.address_1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order has no complete shipping address — courier booking needs name, phone and address."
      )
    }

    const shipment_items = (fulfillment.items ?? [])
      .filter((item: any) => item.line_item_id)
      .map((item: any) => ({
        id: item.line_item_id,
        quantity: item.quantity,
      }))

    // Weight from the order's line-item variants; providers clamp to their
    // own bounds (Pathao 0.5–10kg) and default to 0.5kg when unknown.
    const weight = (order.items ?? []).reduce(
      (sum: number, item: any) =>
        sum + (Number(item.variant?.weight) || 0) * (item.quantity || 1),
      0
    )
    const item_count = (fulfillment.items ?? []).reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    )

    if (!shipment_items.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Fulfillment ${input.fulfillment_id} has no items to ship.`
      )
    }

    const context: OrderFulfillmentContext = {
      order_id: input.order_id,
      fulfillment_id: input.fulfillment_id,
      recipient: {
        name: `${address.first_name} ${address.last_name ?? ""}`.trim(),
        phone: address.phone,
        address: [address.address_1, address.address_2, address.city]
          .filter(Boolean)
          .join(", "),
        city: address.city ?? undefined,
        postal_code: address.postal_code ?? undefined,
        country_code: address.country_code ?? undefined,
      },
      weight,
      item_count: Math.max(1, item_count),
      shipment_items,
    }

    return new StepResponse(context, context.fulfillment_id)
  }
)
