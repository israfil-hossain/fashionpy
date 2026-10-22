import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const rules = await service.listFpRewardRules({ is_active: true })
  res.json({ rewards: rules })
}
