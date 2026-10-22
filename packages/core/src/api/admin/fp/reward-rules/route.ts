import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const rules = await service.listFpRewardRules({}, { take: 100 })
  res.json({ reward_rules: rules })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const rule = (await service.createFpRewardRules(req.body as any))[0]
  res.json({ reward_rule: rule })
}
