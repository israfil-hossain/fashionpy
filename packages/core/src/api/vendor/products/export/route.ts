import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { exportProductsWorkflow } from "../../../../workflows/product/workflows/export-products"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ url: string }>
) => {
  const sellerId = req.seller_context!.seller_id

  const { result } = await exportProductsWorkflow(req.scope).run({
    input: {
      seller_id: sellerId,
    },
  })

  res.json(result)
}
