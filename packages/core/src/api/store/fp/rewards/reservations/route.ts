import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const POST = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id
  const body = (req.body as any) || {}
  const service: any = req.scope.resolve(MercurModules.FP)
  const reservation = await service.reservePoints({
    customerId,
    points: Number(body.points_to_redeem || 0),
    orderId: body.cart_id || null,
    idempotencyKey: body.idempotency_key || null,
  })
  res.json({ reservation })
}
