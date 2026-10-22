import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const POST = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const body = (req.body as any) || {}
  const service: any = req.scope.resolve(MercurModules.FP)
  const [promo] = await service.listFpPromotions({ id: body.promotion_id })
  const now = new Date()
  const expired = promo && promo.ends_at && new Date(promo.ends_at) < now
  res.json({ valid: !!promo && !expired, promotion: promo })
}
