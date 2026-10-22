import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const sellerId = (req as any).seller_context?.seller_id
  const service: any = req.scope.resolve(MercurModules.FP)
  const bundles = await service.listFpBundles({ seller_id: sellerId }, { take: 1000 })
  res.json({ bundles_count: bundles.length })
}
