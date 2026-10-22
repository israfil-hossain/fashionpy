import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const bundles = await service.listFpBundles({}, { take: 1000 })
  const allocations = await service.listFpDiscountAllocations({}, { take: 1000 })
  res.json({ bundles_count: bundles.length, allocations_count: allocations.length })
}
