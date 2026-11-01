import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

import { importProductsWorkflow } from "../../../../workflows/product/workflows/import-products"

export const POST = async (
  req: AuthenticatedMedusaRequest<Record<string, never>> & {
    file?: Express.Multer.File
  },
  res: MedusaResponse<{ summary: { created: number } }>
) => {
  const file = req.file

  if (!file) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No file uploaded. Please upload a CSV file."
    )
  }

  const sellerId = req.seller_context!.seller_id
  const fileContent = file.buffer.toString("utf-8")

  const { result } = await importProductsWorkflow(req.scope).run({
    input: {
      file_content: fileContent,
      seller_id: sellerId,
      status: ProductStatus.DRAFT,
    },
  })

  res.status(200).json({
    summary: {
      created: Array.isArray(result) ? result.length : 0,
    },
  })
}
