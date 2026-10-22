import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const [bundle] = await service.listFpBundles({ id: req.params.id })
  const items = await service.listFpBundleItems({ bundle_id: req.params.id })
  res.json({ bundle, items })
}

export const PATCH = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const bundle = (await service.updateFpBundles({ id: req.params.id, ...(req.body as any) }))[0]
  res.json({ bundle })
}
