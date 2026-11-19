import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetPolicyPageParamsType = z.infer<typeof AdminGetPolicyPageParams>
export const AdminGetPolicyPageParams = createSelectParams()

export type AdminGetPolicyPagesParamsType = z.infer<
  typeof AdminGetPolicyPagesParams
>
export const AdminGetPolicyPagesParams = createFindParams({
  offset: 0,
  limit: 20,
  order: "-created_at",
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    slug: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.enum(["draft", "published"]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

const policyPageBody = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.coerce.date().nullable().optional(),
  unpublished_at: z.coerce.date().nullable().optional(),
  country_codes: z.array(z.string().length(2)).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type AdminCreatePolicyPageType = z.infer<typeof AdminCreatePolicyPage>
export const AdminCreatePolicyPage = policyPageBody.strict()

export type AdminUpdatePolicyPageType = z.infer<typeof AdminUpdatePolicyPage>
export const AdminUpdatePolicyPage = policyPageBody.partial().strict()
