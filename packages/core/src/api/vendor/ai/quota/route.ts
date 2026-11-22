import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { readAiProductQuota, type AiProductQuota } from "../../../../ai"

type SellerQuotaRow = {
  id: string
  metadata?: Record<string, unknown> | null
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AiProductQuota>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "metadata"],
    filters: { id: sellerId },
  })

  res.json(readAiProductQuota((seller as SellerQuotaRow | undefined)?.metadata))
}