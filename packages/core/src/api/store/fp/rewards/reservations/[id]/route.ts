import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const DELETE = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const reservation = await service.releaseReservation(req.params.id)
  res.json({ reservation })
}
