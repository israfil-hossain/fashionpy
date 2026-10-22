import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const relations = await service.listFpProductRelations({ source_product_id: req.params.id, status: "active" })
  res.json({ recommendations: relations })
}
