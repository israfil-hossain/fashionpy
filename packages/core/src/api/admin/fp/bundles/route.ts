import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const bundles = await service.listFpBundles({}, { take: 100 })
  res.json({ bundles, count: bundles.length })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(MercurModules.FP)
  const body = (req.body as any) || {}
  const bundle = (await service.createFpBundles(body))[0]
  res.json({ bundle })
}
