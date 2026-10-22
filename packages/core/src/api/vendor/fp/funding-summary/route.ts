import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const sellerId = (req as any).seller_context?.seller_id
  const service: any = req.scope.resolve(MercurModules.FP)
  const allocations = await service.listFpDiscountAllocations({ seller_id: sellerId }, { take: 100 })
  res.json({ allocations })
}
