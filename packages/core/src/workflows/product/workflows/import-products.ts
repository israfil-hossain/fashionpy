import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { parseProductCsvStep } from "@medusajs/core-flows"
import { ProductStatus } from "@mercurjs/types"
import type { CreateProductsWorkflowInput } from "./create-products"
import { validateProductsToImportStep } from "../steps/validate-products-to-import"
import { createProductsWorkflow } from "./create-products"

type ImportProductsWorkflowInput = {
  file_content: string
  seller_id: string
  status?: ProductStatus
}

export const importProductsWorkflowId = "mercur-import-products"

export const importProductsWorkflow = createWorkflow(
  importProductsWorkflowId,
  function (input: ImportProductsWorkflowInput) {
    const parsedProducts = parseProductCsvStep(input.file_content)

    const validatedProducts = validateProductsToImportStep({
      products: parsedProducts,
    })

    const productsInput = transform(
      { validatedProducts, input },
      ({ validatedProducts, input }): CreateProductsWorkflowInput => ({
        products: (validatedProducts as unknown as Record<string, unknown>[]).map(
          (product) => ({
            ...product,
            title: product.title as string,
            status:
              (product.status as string) || input.status || ProductStatus.DRAFT,
            seller_ids: [input.seller_id],
          })
        ) as CreateProductsWorkflowInput["products"],
        created_by: input.seller_id,
      })
    )

    const createdProducts = createProductsWorkflow.runAsStep({
      input: productsInput,
    })

    return new WorkflowResponse(createdProducts)
  }
)
