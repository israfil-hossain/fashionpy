import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id
  const service: any = req.scope.resolve(MercurModules.FP)
  const [account] = await service.listFpLoyaltyAccounts({ customer_id: customerId })
  const txns = account ? await service.listFpLoyaltyTransactions({ account_id: account.id }) : []
  res.json({ transactions: txns })
}
