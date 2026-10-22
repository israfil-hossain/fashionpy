import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const POST = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id
  const body = (req.body as any) || {}
  const pointsToRedeem = Number(body.points_to_redeem || 0)
  const service: any = req.scope.resolve(MercurModules.FP)
  const [account] = await service.listFpLoyaltyAccounts({ customer_id: customerId })
  const available = account?.available_points || 0
  const pointsValue = Math.floor(pointsToRedeem / 100) * 10
  res.json({
    points_requested: pointsToRedeem,
    points_value_bdt: pointsValue,
    discount_bdt: pointsValue,
    maximum_discount_bdt: Math.floor((body.eligible_subtotal_bdt || 0) * 0.1),
    status: available >= pointsToRedeem ? "eligible" : "insufficient_points",
  })
}
