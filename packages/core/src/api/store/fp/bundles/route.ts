import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const bundles = await service.listFpBundles({ status: "active" }, { take: 50 })
  res.json({ bundles, count: bundles.length })
}
