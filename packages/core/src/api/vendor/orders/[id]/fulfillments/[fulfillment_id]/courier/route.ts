import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  CourierDeliveryType,
  HttpTypes,
  MercurModules,
} from "@mercurjs/types"

import { validateSellerOrder } from "../../../../helpers"
import { VendorBookCourierShipmentType } from "../../../../validators"
import { createCourierShipmentWorkflow } from "../../../../../../../workflows/courier"
import type CourierModuleService from "../../../../../../../modules/courier/services/courier-module-service"

const DELIVERY_TYPES: Record<string, CourierDeliveryType> = {
  normal: CourierDeliveryType.NORMAL,
  on_demand: CourierDeliveryType.ON_DEMAND,
  point: CourierDeliveryType.POINT,
}

/**
 * POST — book a courier consignment for an existing fulfillment.
 * COD (`use_cod`) books on the platform courier account with the full order
 * total so COD cash is remitted to the platform (commission stays automatic).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBookCourierShipmentType>,
  res: MedusaResponse<HttpTypes.VendorCourierShipmentResponse | { message: string }>
) => {
  const { id, fulfillment_id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerOrder(req.scope, sellerId, id)

  const body = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "total",
      "currency_code",
      "cart.payment_collection.payment_sessions.provider_id",
    ],
    filters: { id },
  })
  const order = orders?.[0]
  if (!order) {
    res.status(404).json({ message: `Order ${id} not found` })
    return
  }

  // COD = the checkout paid with the pp_cod provider (no online charge).
  // Explicit body.use_cod still wins so operators can force it.
  const sessions: { provider_id?: string }[] =
    (order as any).cart?.payment_collection?.payment_sessions ?? []
  const orderIsCod = sessions.some((s) => s.provider_id === "pp_cod")
  const useCod = body.use_cod ?? orderIsCod

  const cod_amount = useCod
    ? Math.round(Number(order.total))
    : (body.cod_amount ?? 0)

  const { result: shipment } = await createCourierShipmentWorkflow(
    req.scope
  ).run({
    input: {
      provider: body.provider,
      seller_id: sellerId,
      order_id: id,
      fulfillment_id,
      cod_amount,
      currency_code: order.currency_code,
      delivery_type: body.delivery_type
        ? DELIVERY_TYPES[body.delivery_type]
        : undefined,
      special_instruction: body.special_instruction,
      item_description: body.item_description,
      weight: body.weight,
    },
  })

  res.status(201).json({ shipment })
}

/**
 * GET — current courier shipment + canonical status for a fulfillment.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCourierShipmentResponse | { message: string }>
) => {
  const { id, fulfillment_id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerOrder(req.scope, sellerId, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // The fulfillment must belong to this seller's order — the order's
  // fulfillment link gives us that check in one query.
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "fulfillments.id"],
    filters: { id },
  })
  const ownsFulfillment = (orders?.[0]?.fulfillments ?? []).some(
    (f: { id: string }) => f.id === fulfillment_id
  )
  if (!ownsFulfillment) {
    res.status(404).json({
      message: `Fulfillment ${fulfillment_id} was not found on order ${id}`,
    })
    return
  }

  const courierService = req.scope.resolve<CourierModuleService>(
    MercurModules.COURIER
  )
  const shipments = await courierService.listCourierShipments({
    fulfillment_id,
  })

  res.json({ shipment: shipments[0] ?? null })
}
