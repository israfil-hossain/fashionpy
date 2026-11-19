import { z } from "zod"
import { createFindParams, createSelectParams } from "@medusajs/medusa/api/utils/validators"

const storePolicyPageFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  slug: z.union([z.string(), z.array(z.string())]).optional(),
  country_code: z.string().length(2).optional(),
})

export type StoreGetPolicyPagesParamsType = z.infer<typeof StoreGetPolicyPagesParams>
export const StoreGetPolicyPagesParams = createFindParams({
  offset: 0,
  limit: 50,
  order: "title",
}).merge(storePolicyPageFields)

/** Detail route reads `slug` from the path, not the query string. */
export type StoreGetPolicyPageParamsType = z.infer<typeof StoreGetPolicyPageParams>
export const StoreGetPolicyPageParams = createSelectParams().merge(
  z.object({
    country_code: z.string().length(2).optional(),
  })
)
