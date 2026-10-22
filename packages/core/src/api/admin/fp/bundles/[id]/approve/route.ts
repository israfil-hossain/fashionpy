import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const bundle = (await service.updateFpBundles({ id: req.params.id, status: "active" }))[0]
  res.json({ bundle })
}
