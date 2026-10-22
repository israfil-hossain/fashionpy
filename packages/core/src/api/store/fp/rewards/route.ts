import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id
  const service: any = req.scope.resolve(MercurModules.FP)
  const acct = await service.getOrCreateLoyaltyAccount(customerId)
  res.json({ account: acct, available_points: acct.available_points })
}
