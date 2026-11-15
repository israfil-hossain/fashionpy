import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type StoreGetPromotionsParamsType = z.infer<
  typeof StoreGetPromotionsParams
>

export const StoreGetPromotionsParams = createFindParams({
  offset: 0,
  limit: 10,
})
