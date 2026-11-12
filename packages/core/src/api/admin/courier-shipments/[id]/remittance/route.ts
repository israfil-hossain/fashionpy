import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { CourierShipmentStatus, MercurModules } from "@mercurjs/types"

import { createOrderPayoutsWorkflow } from "../../../../../workflows/payout"
import type CourierModuleService from "../../../../../modules/courier/services/courier-module-service"
import { AdminMarkCodRemittedType } from "../../validators"

/**
 * Records that the courier remitted a COD shipment's cash to the platform —
 * the missing fact the payout gate waits on — and re-decides the order's
 * payout so a held seller share goes out right away.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminMarkCodRemittedType>,
  res: MedusaResponse
) => {
  const courierService = req.scope.resolve<CourierModuleService>(
    MercurModules.COURIER
  )

  const { data: shipments } = await req.scope
    .resolve(ContainerRegistrationKeys.QUERY)
    .graph({
      entity: "courier_shipment",
      fields: ["id", "order_id", "cod_amount", "status"],
      filters: { id: req.params.id },
    })

  const shipment = shipments[0] as
    | { id: string; order_id: string; cod_amount: unknown; status: string }
    | undefined

  if (!shipment) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Courier shipment ${req.params.id} was not found`
    )
  }

  const codAmount = Number(shipment.cod_amount ?? 0)
  if (!(codAmount > 0)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Courier shipment ${shipment.id} has no COD amount to remit`
    )
  }

  if (
    shipment.status === CourierShipmentStatus.CANCELED ||
    shipment.status === CourierShipmentStatus.RETURNED ||
    shipment.status === CourierShipmentStatus.FAILED
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Courier shipment ${shipment.id} is ${shipment.status}; nothing was collected to remit`
    )
  }

  const { remitted_at, reference } = req.validatedBody

  await courierService.updateCourierShipments({
    id: shipment.id,
    cod_remitted_at: remitted_at ?? new Date(),
    ...(reference !== undefined
      ? { cod_remittance_reference: reference }
      : {}),
  })

  if (shipment.order_id) {
    await createOrderPayoutsWorkflow(req.scope).run({
      input: { order_ids: [shipment.order_id] },
    })
  }

  const { data: refetchedRows } = await req.scope
    .resolve(ContainerRegistrationKeys.QUERY)
    .graph({
      entity: "courier_shipment",
      fields: req.queryConfig.fields,
      filters: { id: shipment.id },
    })

  res.json({ shipment: refetchedRows[0] })
}
