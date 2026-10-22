import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const sellerId = (req as any).seller_context?.seller_id
  const service: any = req.scope.resolve(MercurModules.FP)
  const bundles = await service.listFpBundles({ seller_id: sellerId }, { take: 100 })
  res.json({ bundles, count: bundles.length })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const sellerId = (req as any).seller_context?.seller_id
  const service: any = req.scope.resolve(MercurModules.FP)
  const bundle = (await service.createFpBundles({ ...(req.body as any), seller_id: sellerId, status: "draft" }))[0]
  res.json({ bundle })
}
