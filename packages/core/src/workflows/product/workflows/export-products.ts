import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { generateProductCsvStep, useQueryGraphStep } from "@medusajs/core-flows"
import type { AdminProduct } from "@medusajs/framework/types"
import { getSellerProductsStep } from "../steps/get-seller-products"

type ExportProductsWorkflowInput = {
  seller_id: string
}

export const exportProductsWorkflowId = "mercur-export-products"

export const exportProductsWorkflow = createWorkflow(
  exportProductsWorkflowId,
  function (input: ExportProductsWorkflowInput) {
    const products = getSellerProductsStep({
      seller_id: input.seller_id,
    })

    const csvFile = generateProductCsvStep(
      products as unknown as AdminProduct[]
    )

    const fileData = useQueryGraphStep({
      entity: "file",
      fields: ["id", "url"],
      filters: {
        id: csvFile.id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    const result = transform({ fileData }, ({ fileData }) => {
      const file = (fileData.data as { id: string; url: string }[])[0]
      return { url: file.url }
    })

    return new WorkflowResponse(result)
  }
)
