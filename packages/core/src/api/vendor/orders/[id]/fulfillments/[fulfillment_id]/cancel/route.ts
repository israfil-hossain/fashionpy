import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import { cancelOrderFulfillmentWorkflow } from "../../../../../../../workflows/order/workflows/cancel-order-fulfillment"
import { validateSellerOrder } from "../../../../helpers"
import { VendorCancelFulfillmentType } from "../../../../validators"
import type CourierModuleService from "../../../../../../../modules/courier/services/courier-module-service"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCancelFulfillmentType>,
  res: MedusaResponse<HttpTypes.VendorOrderResponse | { message: string }>
) => {
  const { id, fulfillment_id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerOrder(req.scope, sellerId, id)

  // Courier bookings mark the fulfillment shipped, and shipped fulfillments
  // cannot be cancelled. Cancel the COURIER consignment first (Pathao returns
  // the package), then revert the shipment state so the platform cancel can
  // run. If the courier refuses (e.g. Steadfast has no cancel API, or the
  // parcel is already picked up), answer 400 with the provider's message —
  // the vendor must cancel in the courier panel first.
  const courier = req.scope.resolve<CourierModuleService>(
    MercurModules.COURIER
  )
  const shipments = await courier.listCourierShipments({
    fulfillment_id,
  })

  if (shipments.length) {
    const result = await courier.cancelBookedShipment({
      seller_id: sellerId,
      fulfillment_id,
    })

    if (!result.canceled) {
      res.status(400).json({
        message:
          result.message ??
          "Could not cancel the courier consignment — cancel it in the courier panel first.",
      })
      return
    }

    // Courier accepted the cancel → the parcel is no longer shipped;
    // clear shipped_at so the platform-side cancel workflow passes its guard.
    try {
      const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT)
      await fulfillmentService.updateFulfillment(fulfillment_id, {
        shipped_at: null,
      } as any)
    } catch (error) {
      console.warn(
        "[courier] could not clear shipped_at for fulfillment",
        fulfillment_id,
        error
      )
    }
  }

  const { additional_data, no_notification } = req.validatedBody

  await cancelOrderFulfillmentWorkflow(req.scope).run({
    input: {
      order_id: id,
      fulfillment_id,
      canceled_by: sellerId,
      no_notification,
      additional_data,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  res.json({ order })
}
