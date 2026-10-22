import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<{ announcement: unknown }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: store } = await query.graph({
    entity: "store",
    fields: ["id", "name", "metadata"],
  })

  const announcement = (store as any)?.metadata?.announcement ?? null

  res.json({
    announcement,
  })
}