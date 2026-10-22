import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const [bundle] = await service.listFpBundles({ id: req.params.id })
  const items = await service.listFpBundleItems({ bundle_id: req.params.id })
  res.json({ bundle, items })
}
