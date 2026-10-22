import { MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const body = (req.body as any) || {}
  const service: any = req.scope.resolve(MercurModules.FP)
  const [account] = await service.listFpLoyaltyAccounts({ customer_id: body.customer_id })
  const txn = (await service.createFpLoyaltyTransactions({
    account_id: account?.id,
    type: "adjust",
    points_delta: body.points_delta || 0,
    status: "committed",
    metadata: { reason: body.reason },
  }))[0]
  if (account) {
    await service.updateFpLoyaltyAccounts({ id: account.id, available_points: (account.available_points || 0) + (body.points_delta || 0) })
  }
  res.json({ transaction: txn })
}
