import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type StoreGetHeroBannersParamsType = z.infer<
  typeof StoreGetHeroBannersParams
>
export const StoreGetHeroBannersParams = createFindParams({
  offset: 0,
  limit: 10,
}).merge(
  z.object({
    slot: z.union([z.string(), z.array(z.string())]).optional(),
  })
)
