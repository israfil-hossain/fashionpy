import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const allocations = await service.listFpDiscountAllocations({}, { take: 100 })
  res.json({ allocations })
}
