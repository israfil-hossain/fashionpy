import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: courier_shipments, metadata } = await query.graph({
    entity: "courier_shipment",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    courier_shipments,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
